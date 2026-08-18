import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { debounceTime, interval, Subject } from 'rxjs';

import { localizedText } from '../../core/i18n/formatters';
import { LanguageService } from '../../core/i18n/language.service';
import { Language } from '../../core/i18n/translations';
import { DriverApiService } from './driver-api.service';
import { DriverHubEvent, DriverHubService } from './driver-hub.service';
import { DriverOrderDto, DriverOrderItemDto, DriverOrderStatus } from './driver.models';
import { StaffSessionService } from '../kitchen/staff-session.service';

export type PageState = 'loading' | 'ready' | 'error' | 'unauthorized';

export interface ConfirmationState {
  readonly orderId: string;
  readonly type: 'start-delivery' | 'mark-delivered';
  readonly order: DriverOrderDto;
}

@Component({
  selector: 'app-driver-page',
  templateUrl: './driver-page.html',
  styleUrl: './driver-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverPage implements OnInit, OnDestroy {
  private readonly api = inject(DriverApiService);
  private readonly sessions = inject(StaffSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refreshTrigger$ = new Subject<void>();

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly realtime = inject(DriverHubService);
  protected readonly state = signal<PageState>('loading');
  protected readonly sessionExpired = signal(false);
  protected readonly orders = signal<readonly DriverOrderDto[]>([]);
  protected readonly now = signal(Date.now());

  protected readonly inFlightOrders = signal<Set<string>>(new Set());
  protected readonly staleOrders = signal<Set<string>>(new Set());
  protected readonly errorOrders = signal<Set<string>>(new Set());
  protected readonly expandedItems = signal<Set<string>>(new Set());

  // Modal / prompt confirmation state
  protected readonly confirmingAction = signal<ConfirmationState | null>(null);

  protected readonly activeOrders = computed(() => {
    const list = this.orders().filter((o) => o.status === 'Ready' || o.status === 'OnTheWay');
    return list.sort((a, b) => {
      // Prioritize OnTheWay (currently in transit) first, then oldest Ready
      if (a.status === 'OnTheWay' && b.status !== 'OnTheWay') return -1;
      if (b.status === 'OnTheWay' && a.status !== 'OnTheWay') return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  });

  protected readonly completedOrders = computed(() => {
    const list = this.orders().filter((o) => o.status === 'Delivered');
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  protected readonly activeCount = computed(() => this.activeOrders().length);
  protected readonly completedCount = computed(() => this.completedOrders().length);

  ngOnInit(): void {
    this.sessions
      .getDriverSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          if (!session.isAuthenticated) {
            this.handleUnauthorizedSession();
            return;
          }
          this.startSync();
        },
        error: () => this.handleUnauthorizedSession(),
      });

    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(Date.now()));
  }

  ngOnDestroy(): void {
    void this.realtime.stop();
  }

  protected setLanguage(language: Language): void {
    this.language.setLanguage(language);
  }

  protected loadOrders(silent = false): void {
    if (!silent && this.orders().length === 0) {
      this.state.set('loading');
    }
    this.api
      .getAssignedOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(this.deduplicateOrders(orders));
          this.state.set('ready');
          this.confirmingAction.set(null);
          this.inFlightOrders.set(new Set());
          this.staleOrders.set(new Set());
          this.errorOrders.set(new Set());
        },
        error: (error: { readonly status?: number }) => {
          if (error.status === 401 || error.status === 403) {
            this.handleUnauthorizedSession();
          } else {
            this.state.set('error');
          }
        },
      });
  }

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    if (this.confirmingAction()) {
      this.cancelConfirmation();
    }
  }

  protected signOut(): void {
    this.sessions
      .signOutDriver()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => void this.router.navigate(['/driver/sign-in']) });
  }

  protected goToSignIn(): void {
    void this.router.navigate(['/driver/sign-in']);
  }

  protected areaName(order: DriverOrderDto): string {
    return localizedText(
      this.language.current(),
      order.deliveryAreaNameAr ?? '',
      order.deliveryAreaNameEn ?? '',
    );
  }

  protected itemName(item: DriverOrderItemDto): string {
    return localizedText(this.language.current(), item.productNameAr, item.productNameEn);
  }

  protected elapsedMinutes(value: string): number {
    return Math.max(0, Math.floor((this.now() - new Date(value).getTime()) / 60_000));
  }

  protected elapsedLabel(value: string): string {
    const minutes = this.elapsedMinutes(value);
    return `${minutes} ${minutes === 1 ? this.copy().driver.minute : this.copy().driver.minutes}`;
  }

  protected statusLabel(status: DriverOrderStatus): string {
    switch (status) {
      case 'Ready':
        return this.copy().driver.statusReady;
      case 'OnTheWay':
        return this.copy().driver.statusOnTheWay;
      case 'Delivered':
        return this.copy().driver.statusDelivered;
      default:
        return status;
    }
  }

  protected realtimeLabel(): string {
    return this.copy().driver[this.realtime.status()];
  }

  protected isCOD(order: DriverOrderDto): boolean {
    return order.paymentMethod === 'Cash' && order.paymentStatus === 'Pending';
  }

  protected isItemsExpanded(orderId: string): boolean {
    return this.expandedItems().has(orderId);
  }

  protected toggleItems(orderId: string): void {
    const set = new Set(this.expandedItems());
    if (set.has(orderId)) {
      set.delete(orderId);
    } else {
      set.add(orderId);
    }
    this.expandedItems.set(set);
  }

  protected requestStartDelivery(order: DriverOrderDto): void {
    this.confirmingAction.set({
      orderId: order.id,
      type: 'start-delivery',
      order,
    });
  }

  protected requestMarkDelivered(order: DriverOrderDto): void {
    this.confirmingAction.set({
      orderId: order.id,
      type: 'mark-delivered',
      order,
    });
  }

  protected cancelConfirmation(): void {
    this.confirmingAction.set(null);
  }

  protected executeConfirmedAction(): void {
    const action = this.confirmingAction();
    if (!action) return;

    const { order, type } = action;
    if (this.inFlightOrders().has(order.id)) return;

    const inFlight = new Set(this.inFlightOrders());
    inFlight.add(order.id);
    this.inFlightOrders.set(inFlight);
    this.confirmingAction.set(null);

    // Clear previous errors for this order
    const stales = new Set(this.staleOrders());
    stales.delete(order.id);
    this.staleOrders.set(stales);

    const errors = new Set(this.errorOrders());
    errors.delete(order.id);
    this.errorOrders.set(errors);

    const apiCall =
      type === 'start-delivery'
        ? this.api.startDelivery(order.id, order.rowVersion)
        : this.api.markDelivered(order.id, order.rowVersion);

    apiCall.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      const currentInFlight = new Set(this.inFlightOrders());
      currentInFlight.delete(order.id);
      this.inFlightOrders.set(currentInFlight);

      if (result === 'success') {
        const nextStatus: DriverOrderStatus = type === 'start-delivery' ? 'OnTheWay' : 'Delivered';
        this.orders.update((list) =>
          list.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o)),
        );
      } else if (result === 'unauthorized') {
        this.handleUnauthorizedSession();
      } else if (result === 'stale') {
        const currentStale = new Set(this.staleOrders());
        currentStale.add(order.id);
        this.staleOrders.set(currentStale);

        // Auto refresh after delay via debounced trigger
        setTimeout(() => this.refreshTrigger$.next(), 2500);
      } else {
        const currentErrors = new Set(this.errorOrders());
        currentErrors.add(order.id);
        this.errorOrders.set(currentErrors);
      }
    });
  }

  private handleUnauthorizedSession(): void {
    this.sessionExpired.set(true);
    this.state.set('unauthorized');
    void this.router.navigate(['/driver/sign-in'], { queryParams: { expired: '1' } });
  }

  private deduplicateOrders(orders: readonly DriverOrderDto[]): readonly DriverOrderDto[] {
    const seen = new Set<string>();
    const result: DriverOrderDto[] = [];
    for (const order of orders) {
      if (!seen.has(order.id)) {
        seen.add(order.id);
        result.push(order);
      }
    }
    return result;
  }

  private startSync(): void {
    this.loadOrders();

    this.refreshTrigger$
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadOrders(true));

    this.realtime.orderAssigned$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((payload) => {
      if (this.isFullDriverOrder(payload)) {
        this.orders.update((list) => {
          const exists = list.some(
            (o) => o.id === payload.id || o.publicCode === payload.publicCode,
          );
          return exists
            ? list.map((o) =>
                o.id === payload.id || o.publicCode === payload.publicCode ? payload : o,
              )
            : [
                payload,
                ...list.filter((o) => o.id !== payload.id && o.publicCode !== payload.publicCode),
              ];
        });
      } else {
        this.refreshTrigger$.next();
      }
    });

    this.realtime.orderStatusChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        if (payload && (payload.id || payload.orderId || payload.publicCode)) {
          const matchId = payload.id ?? payload.orderId;
          const matchCode = payload.publicCode;
          const newStatus = payload.newStatus ?? payload.status;

          let found = false;
          this.orders.update((list) =>
            list.map((o) => {
              if ((matchId && o.id === matchId) || (matchCode && o.publicCode === matchCode)) {
                found = true;
                return {
                  ...o,
                  status: (newStatus ?? o.status) as DriverOrderStatus,
                  rowVersion: payload.rowVersion ?? o.rowVersion,
                };
              }
              return o;
            }),
          );

          if (!found) {
            this.refreshTrigger$.next();
          }
        } else {
          this.refreshTrigger$.next();
        }
      });

    this.realtime.orderCompleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((orderIdOrCode) => {
        this.orders.update((list) =>
          list.map((o) =>
            o.id === orderIdOrCode || o.publicCode === orderIdOrCode
              ? { ...o, status: 'Delivered' as const }
              : o,
          ),
        );
      });

    this.realtime.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadOrders(true));

    void this.realtime.start().catch(() => undefined);
  }

  private isFullDriverOrder(order: DriverOrderDto | DriverHubEvent): order is DriverOrderDto {
    return (
      typeof (order as DriverOrderDto).id === 'string' &&
      typeof (order as DriverOrderDto).publicCode === 'string' &&
      typeof (order as DriverOrderDto).customerName === 'string' &&
      typeof (order as DriverOrderDto).total === 'number'
    );
  }
}
