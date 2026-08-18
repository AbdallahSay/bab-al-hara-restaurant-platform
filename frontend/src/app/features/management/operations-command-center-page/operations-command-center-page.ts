import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { LanguageService } from '../../../core/i18n/language.service';
import { StaffSessionService } from '../../kitchen/staff-session.service';
import { ManagementApiService } from '../management-api.service';
import {
  OperationsActiveOrderDto,
  OperationsAttentionItemDto,
  OperationsCommandCenterResponse,
  OperationsSummaryDto,
} from '../management.models';
import { OperationsRealtimeService } from '../operations-realtime.service';

export type StatusFilter =
  'ALL' | 'Pending' | 'Confirmed' | 'Preparing' | 'Ready' | 'OnTheWay' | 'WAITING_DRIVER';
export type FulfillmentFilter = 'ALL' | 'Takeaway' | 'Delivery';

@Component({
  selector: 'app-operations-command-center-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './operations-command-center-page.html',
  styleUrls: ['./operations-command-center-page.scss'],
})
export class OperationsCommandCenterPage implements OnInit {
  private readonly managementApi = inject(ManagementApiService);
  private readonly realtime = inject(OperationsRealtimeService);
  private readonly languageService = inject(LanguageService);
  private readonly session = inject(StaffSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly language = this.languageService;
  readonly copy = this.languageService.copy;
  readonly realtimeStatus = this.realtime.status;

  // Data state
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly lastUpdated = signal<Date | null>(null);

  readonly summary = signal<OperationsSummaryDto>({
    activeOrders: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    onTheWay: 0,
    deliveryWaitingForDriver: 0,
  });
  readonly attentionItems = signal<readonly OperationsAttentionItemDto[]>([]);
  readonly activeOrders = signal<readonly OperationsActiveOrderDto[]>([]);

  // Filtering & search
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly fulfillmentFilter = signal<FulfillmentFilter>('ALL');
  readonly searchQuery = signal('');

  // Inspection Drawer
  readonly selectedOrder = signal<OperationsActiveOrderDto | null>(null);
  readonly isDrawerOpen = computed(() => this.selectedOrder() !== null);

  // Time ticker for local elapsed calculations
  readonly now = signal<number>(Date.now());

  private readonly refreshTrigger$ = new Subject<void>();

  // Filtered orders computation
  readonly filteredOrders = computed(() => {
    const orders = this.activeOrders();
    const statusF = this.statusFilter();
    const fulfillF = this.fulfillmentFilter();
    const query = this.searchQuery().trim().toLowerCase();

    return orders.filter((order) => {
      // Status filter
      if (statusF === 'WAITING_DRIVER') {
        if (!(order.status === 'Ready' && order.orderType === 'Delivery' && !order.driverId)) {
          return false;
        }
      } else if (statusF !== 'ALL' && order.status !== statusF) {
        return false;
      }

      // Fulfillment filter
      if (fulfillF !== 'ALL' && order.orderType !== fulfillF) {
        return false;
      }

      // Search query (PublicCode or customer name/phone)
      if (query.length > 0) {
        const matchesCode = order.publicCode.toLowerCase().includes(query);
        const matchesCustomer = order.customerName.toLowerCase().includes(query);
        const matchesPhone = order.customerPhone.toLowerCase().includes(query);
        if (!matchesCode && !matchesCustomer && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  });

  ngOnInit(): void {
    this.loadOperations(true);

    // Debounced refresh trigger
    this.refreshTrigger$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.loadOperations(false));

    // Connect realtime
    this.realtime.start().catch(() => {
      // Non-blocking fallback to REST
    });

    // Realtime event subscriptions
    this.realtime.operationsUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshTrigger$.next());

    this.realtime.orderCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshTrigger$.next());

    this.realtime.orderStatusChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshTrigger$.next());

    this.realtime.driverAssigned$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshTrigger$.next());

    this.realtime.reconnected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshTrigger$.next());

    // Lightweight 1-minute ticker for display timestamps
    const timerId = setInterval(() => {
      this.now.set(Date.now());
    }, 60_000);

    this.destroyRef.onDestroy(() => {
      clearInterval(timerId);
      void this.realtime.stop();
      this.destroy$.next();
      this.destroy$.complete();
    });
  }

  private readonly destroy$ = new Subject<void>();

  loadOperations(isInitial = false): void {
    if (isInitial) {
      this.loading.set(true);
    } else {
      this.refreshing.set(true);
    }
    this.error.set(null);

    this.managementApi.getOperationsSnapshot().subscribe({
      next: (response: OperationsCommandCenterResponse) => {
        this.summary.set(response.summary);
        this.attentionItems.set(response.attentionItems);
        this.activeOrders.set(response.activeOrders);
        this.lastUpdated.set(new Date());
        this.loading.set(false);
        this.refreshing.set(false);

        // Keep selected order in drawer in sync if open
        const currentSelected = this.selectedOrder();
        if (currentSelected) {
          const updated = response.activeOrders.find((o) => o.orderId === currentSelected.orderId);
          if (updated) {
            this.selectedOrder.set(updated);
          }
        }
      },
      error: () => {
        this.error.set(this.copy().management.operations.errors.loadFailed);
        this.loading.set(false);
        this.refreshing.set(false);
      },
    });
  }

  setLanguage(lang: 'ar' | 'en'): void {
    this.languageService.setLanguage(lang);
  }

  signOut(): void {
    this.session.signOutManagement().subscribe({
      next: () => this.router.navigate(['/management/sign-in']),
      error: () => this.router.navigate(['/management/sign-in']),
    });
  }

  setStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
  }

  setFulfillmentFilter(fulfillment: FulfillmentFilter): void {
    this.fulfillmentFilter.set(fulfillment);
  }

  selectOrder(order: OperationsActiveOrderDto): void {
    this.selectedOrder.set(order);
  }

  openOrderByCode(publicCode: string): void {
    const match = this.activeOrders().find((o) => o.publicCode === publicCode);
    if (match) {
      this.selectedOrder.set(match);
    }
  }

  closeDrawer(): void {
    this.selectedOrder.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isDrawerOpen()) {
      this.closeDrawer();
    }
  }

  // Factual Elapsed Time Formatters
  formatElapsed(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const diffMs = Math.max(0, this.now() - date.getTime());
    const diffMinutes = Math.floor(diffMs / 60_000);

    if (diffMinutes < 1) {
      return this.copy().management.operations.time.justNow;
    }

    if (diffMinutes < 60) {
      return this.copy().management.operations.time.minutesAgo.replace(
        '{m}',
        diffMinutes.toString(),
      );
    }

    const diffHours = Math.floor(diffMinutes / 60);
    return this.copy().management.operations.time.hoursAgo.replace('{h}', diffHours.toString());
  }

  formatInState(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const diffMs = Math.max(0, this.now() - date.getTime());
    const diffMinutes = Math.floor(diffMs / 60_000);

    if (diffMinutes < 1) {
      return this.copy().management.operations.time.justNow;
    }

    if (diffMinutes < 60) {
      return this.copy().management.operations.time.inStateForMinutes.replace(
        '{m}',
        diffMinutes.toString(),
      );
    }

    const diffHours = Math.floor(diffMinutes / 60);
    return this.copy().management.operations.time.inStateForHours.replace(
      '{h}',
      diffHours.toString(),
    );
  }

  formatTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString(this.language.current() === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatCurrency(amount: number): string {
    return `${amount.toFixed(2)} ${this.copy().common.currency}`;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'badge--pending';
      case 'Confirmed':
        return 'badge--confirmed';
      case 'Preparing':
        return 'badge--preparing';
      case 'Ready':
        return 'badge--ready';
      case 'OnTheWay':
        return 'badge--ontheway';
      case 'Delivered':
        return 'badge--delivered';
      default:
        return 'badge--default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Pending':
        return this.copy().management.operations.summary.pending;
      case 'Confirmed':
        return this.copy().management.operations.summary.confirmed;
      case 'Preparing':
        return this.copy().management.operations.summary.preparing;
      case 'Ready':
        return this.copy().management.operations.summary.ready;
      case 'OnTheWay':
        return this.copy().management.operations.summary.onTheWay;
      case 'Delivered':
        return this.copy().orderTracking.steps.delivered;
      default:
        return status;
    }
  }

  getAttentionReasonLabel(reasonCode: string): string {
    switch (reasonCode) {
      case 'unassigned_ready_delivery':
        return this.copy().management.operations.attention.unassignedDelivery;
      case 'unacknowledged_pending':
        return this.copy().management.operations.attention.unacknowledgedPending;
      default:
        return reasonCode;
    }
  }
}
