import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { interval } from 'rxjs';

import { localizedText } from '../../core/i18n/formatters';
import { LanguageService } from '../../core/i18n/language.service';
import { Language } from '../../core/i18n/translations';
import { CashierApiService } from './cashier-api.service';
import { CashierHubService } from './cashier-hub.service';
import { CashierOrderDto, CashierOrderItemDto, DriverSummaryDto } from './cashier.models';
import { StaffSessionService } from '../kitchen/staff-session.service';

export type PageState = 'loading' | 'ready' | 'error';
export type QueueFilter = 'all' | 'takeaway' | 'delivery' | 'unpaid';

@Component({
  selector: 'app-cashier-page',
  templateUrl: './cashier-page.html',
  styleUrl: './cashier-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashierPage implements OnInit, OnDestroy {
  private readonly api = inject(CashierApiService);
  private readonly sessions = inject(StaffSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private audioContext?: AudioContext;

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly realtime = inject(CashierHubService);
  protected readonly state = signal<PageState>('loading');
  protected readonly orders = signal<readonly CashierOrderDto[]>([]);
  protected readonly drivers = signal<readonly DriverSummaryDto[]>([]);
  protected readonly selectedFilter = signal<QueueFilter>('all');
  protected readonly searchQuery = signal('');
  protected readonly expandedOrderIds = signal<Set<string>>(new Set());
  protected readonly soundEnabled = signal(false);
  protected readonly newOrderBanner = signal<string | null>(null);
  protected readonly now = signal(Date.now());

  // Handoff confirmation state (Takeaway)
  protected readonly inFlightHandoffs = signal<Set<string>>(new Set());
  protected readonly staleOrders = signal<Set<string>>(new Set());
  protected readonly errorOrders = signal<Set<string>>(new Set());
  protected readonly confirmingOrders = signal<Set<string>>(new Set());

  // Driver assignment state (Delivery)
  protected readonly selectedDrivers = signal<Map<string, string>>(new Map());
  protected readonly confirmingAssignments = signal<Set<string>>(new Set());
  protected readonly inFlightAssignments = signal<Set<string>>(new Set());
  protected readonly staleAssignmentOrders = signal<Set<string>>(new Set());
  protected readonly errorAssignmentOrders = signal<Set<string>>(new Set());

  protected readonly sortedOrders = computed(() =>
    [...this.orders()].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    ),
  );

  protected readonly filteredOrders = computed(() => {
    const list = this.sortedOrders();
    const filter = this.selectedFilter();
    const query = this.searchQuery().trim().toLowerCase();

    return list.filter((order) => {
      // Status/Type filter
      if (filter === 'takeaway' && order.orderType !== 'Takeaway') return false;
      if (filter === 'delivery' && order.orderType !== 'Delivery') return false;
      if (filter === 'unpaid' && order.paymentStatus !== 'Pending') return false;

      // Text search filter
      if (query) {
        const publicCode = order.publicCode.toLowerCase();
        const customerName = order.customerName.toLowerCase();
        const areaAr = (order.deliveryAreaNameAr ?? '').toLowerCase();
        const areaEn = (order.deliveryAreaNameEn ?? '').toLowerCase();
        const address = (order.address ?? '').toLowerCase();
        const driverName = (order.driverName ?? '').toLowerCase();

        return (
          publicCode.includes(query) ||
          customerName.includes(query) ||
          areaAr.includes(query) ||
          areaEn.includes(query) ||
          address.includes(query) ||
          driverName.includes(query)
        );
      }

      return true;
    });
  });

  protected readonly totalCount = computed(() => this.orders().length);
  protected readonly takeawayCount = computed(
    () => this.orders().filter((o) => o.orderType === 'Takeaway').length,
  );
  protected readonly deliveryCount = computed(
    () => this.orders().filter((o) => o.orderType === 'Delivery').length,
  );
  protected readonly unpaidCount = computed(
    () => this.orders().filter((o) => o.paymentStatus === 'Pending').length,
  );

  protected readonly allExpanded = computed(() => {
    const visible = this.filteredOrders();
    if (visible.length === 0) return false;
    const expanded = this.expandedOrderIds();
    return visible.every((o) => expanded.has(o.id));
  });

  ngOnInit(): void {
    this.sessions
      .getCashierSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          if (!session.isAuthenticated) {
            void this.router.navigate(['/cashier/sign-in']);
            return;
          }
          this.startSync();
        },
        error: () => void this.router.navigate(['/cashier/sign-in']),
      });

    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(Date.now()));
  }

  ngOnDestroy(): void {
    void this.realtime.stop();
    void this.audioContext?.close();
  }

  protected setLanguage(language: Language): void {
    this.language.setLanguage(language);
  }

  protected loadOrders(): void {
    if (this.orders().length === 0) {
      this.state.set('loading');
    }
    this.loadDrivers();
    this.api
      .getReadyOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          const prevCount = this.orders().length;
          this.orders.set(orders);
          this.state.set('ready');
          this.confirmingOrders.set(new Set());
          this.inFlightHandoffs.set(new Set());
          this.staleOrders.set(new Set());
          this.errorOrders.set(new Set());
          this.confirmingAssignments.set(new Set());
          this.inFlightAssignments.set(new Set());
          this.staleAssignmentOrders.set(new Set());
          this.errorAssignmentOrders.set(new Set());

          if (prevCount > 0 && orders.length > prevCount) {
            this.triggerNewOrderAlert();
          }
        },
        error: (error: { readonly status?: number }) => {
          if (error.status === 401 || error.status === 403) {
            void this.router.navigate(['/cashier/sign-in']);
          } else {
            this.state.set('error');
          }
        },
      });
  }

  protected loadDrivers(): void {
    this.api
      .getDrivers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (drivers) => this.drivers.set(drivers),
        error: () => this.drivers.set([]),
      });
  }

  protected setFilter(filter: QueueFilter): void {
    this.selectedFilter.set(filter);
  }

  protected setSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected toggleDetails(orderId: string): void {
    const current = new Set(this.expandedOrderIds());
    if (current.has(orderId)) {
      current.delete(orderId);
    } else {
      current.add(orderId);
    }
    this.expandedOrderIds.set(current);
  }

  protected toggleAllDetails(): void {
    const visible = this.filteredOrders();
    if (this.allExpanded()) {
      this.expandedOrderIds.set(new Set());
    } else {
      const allIds = new Set(visible.map((o) => o.id));
      this.expandedOrderIds.set(allIds);
    }
  }

  protected enableSound(): void {
    this.audioContext ??= new AudioContext();
    void this.audioContext.resume();
    this.soundEnabled.set(true);
  }

  protected signOut(): void {
    this.sessions
      .signOutCashier()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => void this.router.navigate(['/cashier/sign-in']) });
  }

  protected orderType(order: CashierOrderDto): string {
    return order.orderType === 'Takeaway'
      ? this.copy().cashier.takeaway
      : this.copy().cashier.delivery;
  }

  protected areaName(order: CashierOrderDto): string {
    return localizedText(
      this.language.current(),
      order.deliveryAreaNameAr ?? '',
      order.deliveryAreaNameEn ?? '',
    );
  }

  protected itemName(item: CashierOrderItemDto): string {
    return localizedText(this.language.current(), item.productNameAr, item.productNameEn);
  }

  protected elapsedMinutes(value: string): number {
    return Math.max(0, Math.floor((this.now() - new Date(value).getTime()) / 60_000));
  }

  protected elapsedLabel(value: string): string {
    const minutes = this.elapsedMinutes(value);
    return `${minutes} ${minutes === 1 ? this.copy().cashier.minute : this.copy().cashier.minutes}`;
  }

  protected isLongWait(value: string): boolean {
    return this.elapsedMinutes(value) >= 15;
  }

  protected realtimeLabel(): string {
    return this.copy().cashier[this.realtime.status()];
  }

  protected statusLabel(status: string): string {
    if (status === 'OnTheWay') return this.copy().cashier.statusOnTheWay;
    if (status === 'Delivered') return this.copy().cashier.statusDelivered;
    return this.copy().cashier.statusReady;
  }

  // Takeaway Cash Handoff
  protected initiateHandoff(orderId: string): void {
    const newConfirming = new Set(this.confirmingOrders());
    newConfirming.add(orderId);
    this.confirmingOrders.set(newConfirming);

    const newStale = new Set(this.staleOrders());
    newStale.delete(orderId);
    this.staleOrders.set(newStale);

    const newErrors = new Set(this.errorOrders());
    newErrors.delete(orderId);
    this.errorOrders.set(newErrors);
  }

  protected cancelHandoff(orderId: string): void {
    const newConfirming = new Set(this.confirmingOrders());
    newConfirming.delete(orderId);
    this.confirmingOrders.set(newConfirming);
  }

  protected confirmHandoff(order: CashierOrderDto): void {
    if (this.inFlightHandoffs().has(order.id)) return;

    const newInFlight = new Set(this.inFlightHandoffs());
    newInFlight.add(order.id);
    this.inFlightHandoffs.set(newInFlight);

    this.api
      .completeCashTakeaway(order.id, order.rowVersion)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        const inFlight = new Set(this.inFlightHandoffs());
        inFlight.delete(order.id);
        this.inFlightHandoffs.set(inFlight);

        if (result === 'success') {
          this.removeOrder(order.id);
        } else if (result === 'stale') {
          const stale = new Set(this.staleOrders());
          stale.add(order.id);
          this.staleOrders.set(stale);

          const confirming = new Set(this.confirmingOrders());
          confirming.delete(order.id);
          this.confirmingOrders.set(confirming);

          setTimeout(() => this.loadOrders(), 2500);
        } else {
          const errors = new Set(this.errorOrders());
          errors.add(order.id);
          this.errorOrders.set(errors);
        }
      });
  }

  // Delivery Driver Assignment
  protected onSelectDriver(orderId: string, event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const driverId = target ? target.value : '';
    const updated = new Map(this.selectedDrivers());
    if (driverId) {
      updated.set(orderId, driverId);
    } else {
      updated.delete(orderId);
    }
    this.selectedDrivers.set(updated);
  }

  protected getSelectedDriver(orderId: string): string {
    return this.selectedDrivers().get(orderId) ?? '';
  }

  protected getDriverName(driverId: string): string {
    return this.drivers().find((d) => d.id === driverId)?.name ?? '';
  }

  protected initiateAssign(orderId: string): void {
    const driverId = this.getSelectedDriver(orderId);
    if (!driverId) return;

    const newConfirming = new Set(this.confirmingAssignments());
    newConfirming.add(orderId);
    this.confirmingAssignments.set(newConfirming);

    const newStale = new Set(this.staleAssignmentOrders());
    newStale.delete(orderId);
    this.staleAssignmentOrders.set(newStale);

    const newErrors = new Set(this.errorAssignmentOrders());
    newErrors.delete(orderId);
    this.errorAssignmentOrders.set(newErrors);
  }

  protected cancelAssign(orderId: string): void {
    const newConfirming = new Set(this.confirmingAssignments());
    newConfirming.delete(orderId);
    this.confirmingAssignments.set(newConfirming);
  }

  protected confirmAssign(order: CashierOrderDto): void {
    const driverId = this.getSelectedDriver(order.id);
    if (!driverId || this.inFlightAssignments().has(order.id)) return;

    const inFlight = new Set(this.inFlightAssignments());
    inFlight.add(order.id);
    this.inFlightAssignments.set(inFlight);

    this.api
      .assignDriver(order.id, driverId, order.rowVersion)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        const currentInFlight = new Set(this.inFlightAssignments());
        currentInFlight.delete(order.id);
        this.inFlightAssignments.set(currentInFlight);

        const currentConfirming = new Set(this.confirmingAssignments());
        currentConfirming.delete(order.id);
        this.confirmingAssignments.set(currentConfirming);

        if (result === 'success') {
          const assignedDriverName = this.getDriverName(driverId);
          this.orders.update((list) =>
            list.map((o) =>
              o.id === order.id
                ? {
                    ...o,
                    driverId,
                    driverName: assignedDriverName || o.driverName,
                    driverAssignedAtUtc: new Date().toISOString(),
                  }
                : o,
            ),
          );
        } else if (result === 'stale') {
          const stale = new Set(this.staleAssignmentOrders());
          stale.add(order.id);
          this.staleAssignmentOrders.set(stale);
          setTimeout(() => this.loadOrders(), 2500);
        } else {
          const error = new Set(this.errorAssignmentOrders());
          error.add(order.id);
          this.errorAssignmentOrders.set(error);
        }
      });
  }

  private startSync(): void {
    this.loadOrders();

    this.realtime.orderCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((orderId) => this.removeOrder(orderId));

    this.realtime.orderDriverAssigned$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.orders.update((list) =>
          list.map((o) => {
            if (o.id === event.orderId || (event.publicCode && o.publicCode === event.publicCode)) {
              return {
                ...o,
                driverId: event.driverId,
                driverName: event.driverName,
                driverAssignedAtUtc: event.driverAssignedAtUtc ?? o.driverAssignedAtUtc,
                rowVersion: event.rowVersion ?? o.rowVersion,
              };
            }
            return o;
          }),
        );
      });

    this.realtime.orderStatusChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const newStatus = (event.newStatus ?? event.status) as CashierOrderDto['status'];
        if (newStatus === 'Delivered') {
          const match = this.orders().find(
            (o) =>
              o.id === event.orderId || (event.publicCode && o.publicCode === event.publicCode),
          );
          if (match) {
            this.removeOrder(match.id);
          }
        } else if (newStatus) {
          this.orders.update((list) =>
            list.map((o) => {
              if (
                o.id === event.orderId ||
                (event.publicCode && o.publicCode === event.publicCode)
              ) {
                return {
                  ...o,
                  status: newStatus,
                  rowVersion: event.rowVersion ?? o.rowVersion,
                };
              }
              return o;
            }),
          );
        }
      });

    this.realtime.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadOrders());

    void this.realtime.start().catch(() => undefined);
  }

  private removeOrder(orderId: string): void {
    this.orders.update((orders) => orders.filter((o) => o.id !== orderId));
    this.expandedOrderIds.update((set) => {
      const next = new Set(set);
      next.delete(orderId);
      return next;
    });
    this.confirmingOrders.update((set) => {
      const next = new Set(set);
      next.delete(orderId);
      return next;
    });
    this.confirmingAssignments.update((set) => {
      const next = new Set(set);
      next.delete(orderId);
      return next;
    });
  }

  private triggerNewOrderAlert(): void {
    this.newOrderBanner.set(this.copy().cashier.newOrder);
    setTimeout(() => this.newOrderBanner.set(null), 4000);
    this.playNotificationChime();
  }

  private playNotificationChime(): void {
    if (!this.soundEnabled() || !this.audioContext) {
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1320, this.audioContext.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.4);
    } catch {
      // Audio context may not be ready or allowed
    }
  }
}
