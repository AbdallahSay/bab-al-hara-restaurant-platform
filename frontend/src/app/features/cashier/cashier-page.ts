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
import { CashierOrderDto, CashierOrderItemDto } from './cashier.models';
import { StaffSessionService } from '../kitchen/staff-session.service';

export type PageState = 'loading' | 'ready' | 'error';
export type QueueFilter = 'all' | 'takeaway' | 'delivery';
export type AgingCategory = 'normal' | 'attention' | 'overdue';

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
  protected readonly now = signal(Date.now());

  protected readonly selectedFilter = signal<QueueFilter>('all');
  protected readonly searchQuery = signal<string>('');
  protected readonly expandedOrderIds = signal<Set<string>>(new Set());

  protected readonly inFlightHandoffs = signal<Set<string>>(new Set());
  protected readonly staleOrders = signal<Set<string>>(new Set());
  protected readonly errorOrders = signal<Set<string>>(new Set());
  protected readonly confirmingOrders = signal<Set<string>>(new Set());

  protected readonly soundEnabled = signal(false);
  protected readonly newOrderBanner = signal<string | null>(null);

  protected readonly totalCount = computed(() => this.orders().length);
  protected readonly takeawayCount = computed(
    () => this.orders().filter((o) => o.orderType === 'Takeaway').length,
  );
  protected readonly deliveryCount = computed(
    () => this.orders().filter((o) => o.orderType === 'Delivery').length,
  );
  protected readonly totalPendingCollection = computed(() =>
    this.orders()
      .filter((o) => o.paymentStatus === 'Pending')
      .reduce((sum, o) => sum + o.total, 0),
  );

  protected readonly filteredOrders = computed(() => {
    const raw = [...this.orders()].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );

    const filter = this.selectedFilter();
    let result = raw;
    if (filter === 'takeaway') {
      result = result.filter((o) => o.orderType === 'Takeaway');
    } else if (filter === 'delivery') {
      result = result.filter((o) => o.orderType === 'Delivery');
    }

    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return result;
    }

    return result.filter(
      (order) =>
        order.publicCode.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        (order.deliveryAreaNameAr && order.deliveryAreaNameAr.toLowerCase().includes(query)) ||
        (order.deliveryAreaNameEn && order.deliveryAreaNameEn.toLowerCase().includes(query)) ||
        (order.address && order.address.toLowerCase().includes(query)),
    );
  });

  protected readonly allExpanded = computed(() => {
    const visible = this.filteredOrders();
    if (visible.length === 0) return false;
    const expanded = this.expandedOrderIds();
    return visible.every((o) => expanded.has(o.id));
  });

  ngOnInit(): void {
    this.sessions
      .getSession()
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
    this.state.set('loading');
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
      .signOut()
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

  protected getAgingCategory(value: string): AgingCategory {
    const minutes = this.elapsedMinutes(value);
    if (minutes >= 20) return 'overdue';
    if (minutes >= 10) return 'attention';
    return 'normal';
  }

  protected agingCategoryLabel(category: AgingCategory): string {
    if (category === 'overdue') return this.copy().cashier.agingOverdue;
    if (category === 'attention') return this.copy().cashier.agingAttention;
    return this.copy().cashier.agingNormal;
  }

  protected realtimeLabel(): string {
    return this.copy().cashier[this.realtime.status()];
  }

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

          // Reload orders after a delay to get the latest authoritative state
          setTimeout(() => this.loadOrders(), 2500);
        } else {
          const errors = new Set(this.errorOrders());
          errors.add(order.id);
          this.errorOrders.set(errors);
        }
      });
  }

  private startSync(): void {
    this.loadOrders();
    this.realtime.orderCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((orderId) => this.removeOrder(orderId));
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
