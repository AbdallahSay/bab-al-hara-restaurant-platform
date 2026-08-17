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
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { interval } from 'rxjs';

import { localizedText } from '../../core/i18n/formatters';
import { LanguageService } from '../../core/i18n/language.service';
import { Language } from '../../core/i18n/translations';
import { OrderStatus } from '../customer-ordering/order.models';
import { StaffSessionService } from '../kitchen/staff-session.service';
import { DriverApiService } from './driver-api.service';
import { DriverHubService } from './driver-hub.service';
import { DriverOrderDto, DriverOrderItem } from './driver.models';

type QueueState = 'loading' | 'ready' | 'error';
type FilterStatus = 'ALL' | 'Ready' | 'OnTheWay' | 'Delivered';

interface PendingAction {
  readonly order: DriverOrderDto;
  readonly actionType: 'startDelivery' | 'markDelivered';
}

@Component({
  selector: 'app-driver-page',
  imports: [FormsModule],
  templateUrl: './driver-page.html',
  styleUrl: './driver-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverPage implements OnInit, OnDestroy {
  private readonly api = inject(DriverApiService);
  private readonly hub = inject(DriverHubService);
  private readonly sessions = inject(StaffSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private toastTimer?: ReturnType<typeof setTimeout>;

  protected readonly localizedText = localizedText;
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly realtime = this.hub;
  protected readonly state = signal<QueueState>('loading');
  protected readonly orders = signal<readonly DriverOrderDto[]>([]);
  protected readonly activeFilter = signal<FilterStatus>('ALL');
  protected readonly searchQuery = signal('');
  protected readonly submittingCodes = signal<readonly string[]>([]);
  protected readonly toastMessage = signal<string | null>(null);
  protected readonly toastType = signal<'success' | 'warning' | 'error'>('success');
  protected readonly newAssignmentCode = signal<string | null>(null);
  protected readonly now = signal(Date.now());
  protected readonly pendingConfirmation = signal<PendingAction | null>(null);

  // Status counts
  protected readonly allCount = computed(() => this.orders().length);
  protected readonly readyCount = computed(
    () => this.orders().filter((o) => o.status === 'Ready').length,
  );
  protected readonly onTheWayCount = computed(
    () => this.orders().filter((o) => o.status === 'OnTheWay').length,
  );
  protected readonly deliveredCount = computed(
    () => this.orders().filter((o) => o.status === 'Delivered').length,
  );

  protected readonly sortedOrders = computed(() =>
    [...this.orders()].sort((left, right) => {
      // Prioritize active orders (Ready, OnTheWay) before Delivered
      const statusWeight: Record<OrderStatus, number> = {
        Ready: 1,
        OnTheWay: 2,
        Pending: 3,
        Confirmed: 4,
        Preparing: 5,
        Delivered: 6,
      };
      const leftWeight = statusWeight[left.status] ?? 99;
      const rightWeight = statusWeight[right.status] ?? 99;
      if (leftWeight !== rightWeight) {
        return leftWeight - rightWeight;
      }
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    }),
  );

  protected readonly filteredOrders = computed(() => {
    const filter = this.activeFilter();
    const query = this.searchQuery().trim().toLowerCase();
    return this.sortedOrders().filter((order) => {
      const matchesFilter = filter === 'ALL' || order.status === filter;
      if (!matchesFilter) return false;
      if (!query) return true;
      return (
        order.publicCode.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.toLowerCase().includes(query) ||
        (order.address && order.address.toLowerCase().includes(query)) ||
        (order.deliveryAreaNameAr && order.deliveryAreaNameAr.toLowerCase().includes(query)) ||
        (order.deliveryAreaNameEn && order.deliveryAreaNameEn.toLowerCase().includes(query))
      );
    });
  });

  ngOnInit(): void {
    this.sessions
      .getSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          if (!session.isAuthenticated) {
            void this.router.navigate(['/driver/sign-in']);
            return;
          }
          this.initDriverOperations();
        },
        error: () => void this.router.navigate(['/driver/sign-in']),
      });

    interval(30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.now.set(Date.now()));
  }

  ngOnDestroy(): void {
    void this.hub.stop();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  protected setLanguage(language: Language): void {
    this.language.setLanguage(language);
  }

  protected setFilter(filter: FilterStatus): void {
    this.activeFilter.set(filter);
  }

  protected loadAssignedOrders(): void {
    if (this.orders().length === 0) {
      this.state.set('loading');
    }
    this.api
      .getAssignedOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.state.set('ready');
        },
        error: (error: { readonly status?: number }) => {
          if (error.status === 401 || error.status === 403) {
            void this.router.navigate(['/driver/sign-in']);
          } else {
            this.state.set('error');
          }
        },
      });
  }

  protected isSubmitting(publicCode: string): boolean {
    return this.submittingCodes().includes(publicCode);
  }

  protected requestStartDelivery(order: DriverOrderDto): void {
    if (this.isSubmitting(order.publicCode)) {
      return;
    }
    this.pendingConfirmation.set({ order, actionType: 'startDelivery' });
  }

  protected requestMarkDelivered(order: DriverOrderDto): void {
    if (this.isSubmitting(order.publicCode)) {
      return;
    }
    this.pendingConfirmation.set({ order, actionType: 'markDelivered' });
  }

  protected cancelPendingAction(): void {
    this.pendingConfirmation.set(null);
  }

  protected confirmPendingAction(): void {
    const pending = this.pendingConfirmation();
    if (!pending) return;

    this.pendingConfirmation.set(null);
    const { order, actionType } = pending;

    if (actionType === 'startDelivery') {
      this.executeStartDelivery(order);
    } else if (actionType === 'markDelivered') {
      this.executeMarkDelivered(order);
    }
  }

  protected executeStartDelivery(order: DriverOrderDto): void {
    if (this.isSubmitting(order.publicCode)) {
      return;
    }

    this.submittingCodes.update((codes) => [...codes, order.publicCode]);
    const id = order.id ?? order.publicCode;
    const rowVersion = order.rowVersion ?? '';

    this.api
      .startDelivery(id, rowVersion)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.clearSubmitting(order.publicCode);
          if (result && result.order) {
            this.updateOrderInList(result.order);
          } else {
            this.updateOrderStatus(order.publicCode, 'OnTheWay');
          }
          this.showToast(this.copy().driver.deliveryStartedSuccess, 'success');
        },
        error: (error: { readonly status?: number }) => {
          this.clearSubmitting(order.publicCode);
          if (error.status === 409) {
            this.showToast(this.copy().driver.orderUpdatedByOther, 'warning');
            this.loadAssignedOrders();
          } else if (error.status === 401 || error.status === 403) {
            void this.router.navigate(['/driver/sign-in']);
          } else {
            this.showToast(this.copy().driver.actionError, 'error');
          }
        },
      });
  }

  protected executeMarkDelivered(order: DriverOrderDto): void {
    if (this.isSubmitting(order.publicCode)) {
      return;
    }

    this.submittingCodes.update((codes) => [...codes, order.publicCode]);
    const id = order.id ?? order.publicCode;
    const rowVersion = order.rowVersion ?? '';

    this.api
      .markDelivered(id, rowVersion)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.clearSubmitting(order.publicCode);
          if (result && result.order) {
            this.updateOrderInList(result.order);
          } else {
            this.updateOrderStatus(order.publicCode, 'Delivered');
          }
          this.showToast(this.copy().driver.orderDeliveredSuccess, 'success');
        },
        error: (error: { readonly status?: number }) => {
          this.clearSubmitting(order.publicCode);
          if (error.status === 409) {
            this.showToast(this.copy().driver.orderUpdatedByOther, 'warning');
            this.loadAssignedOrders();
          } else if (error.status === 401 || error.status === 403) {
            void this.router.navigate(['/driver/sign-in']);
          } else {
            this.showToast(this.copy().driver.actionError, 'error');
          }
        },
      });
  }

  protected signOut(): void {
    this.sessions
      .signOut()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => void this.router.navigate(['/driver/sign-in']) });
  }

  protected areaName(order: DriverOrderDto): string {
    return localizedText(
      this.language.current(),
      order.deliveryAreaNameAr ?? '',
      order.deliveryAreaNameEn ?? '',
    );
  }

  protected itemName(item: DriverOrderItem): string {
    return localizedText(this.language.current(), item.productNameAr, item.productNameEn);
  }

  protected receivedAt(value: string): string {
    return new Intl.DateTimeFormat(this.language.current() === 'ar' ? 'ar-EG' : 'en-EG', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }

  protected elapsedMinutes(value: string): number {
    return Math.max(0, Math.floor((this.now() - new Date(value).getTime()) / 60_000));
  }

  protected elapsedLabel(value: string): string {
    const minutes = this.elapsedMinutes(value);
    return `${minutes} ${minutes === 1 ? this.copy().driver.minute : this.copy().driver.minutes}`;
  }

  protected realtimeLabel(): string {
    return this.copy().driver[this.realtime.status()];
  }

  protected formatCurrency(amount: number): string {
    return `${amount.toFixed(2)} ${this.copy().common.currency}`;
  }

  private clearSubmitting(publicCode: string): void {
    this.submittingCodes.update((codes) => codes.filter((c) => c !== publicCode));
  }

  private updateOrderInList(updatedOrder: DriverOrderDto): void {
    this.orders.update((orders) => {
      const exists = orders.some((o) => o.publicCode === updatedOrder.publicCode);
      if (exists) {
        return orders.map((o) => (o.publicCode === updatedOrder.publicCode ? updatedOrder : o));
      }
      return [updatedOrder, ...orders];
    });
  }

  private updateOrderStatus(publicCode: string, status: OrderStatus): void {
    this.orders.update((orders) =>
      orders.map((o) => (o.publicCode === publicCode ? { ...o, status } : o)),
    );
  }

  private showToast(message: string, type: 'success' | 'warning' | 'error' = 'success'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  private initDriverOperations(): void {
    this.loadAssignedOrders();

    this.hub.orderAssigned$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((order) => {
      this.receiveAssignedOrder(order);
    });

    this.hub.orderStatusChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.orders.update((orders) =>
        orders.map((o) =>
          o.publicCode === event.publicCode
            ? {
                ...o,
                status: event.status ?? o.status,
                rowVersion: event.rowVersion ?? o.rowVersion,
              }
            : o,
        ),
      );
    });

    this.hub.reconnected$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadAssignedOrders();
    });

    void this.hub.start().catch(() => undefined);
  }

  private receiveAssignedOrder(order: DriverOrderDto): void {
    this.orders.update((orders) => {
      const withoutExisting = orders.filter(
        (candidate) => candidate.publicCode !== order.publicCode,
      );
      return [order, ...withoutExisting];
    });
    this.state.set('ready');
    this.newAssignmentCode.set(order.publicCode);
    this.showToast(`${this.copy().driver.newAssignment} (#${order.publicCode})`, 'success');

    globalThis.setTimeout(() => {
      if (this.newAssignmentCode() === order.publicCode) {
        this.newAssignmentCode.set(null);
      }
    }, 10_000);
  }
}
