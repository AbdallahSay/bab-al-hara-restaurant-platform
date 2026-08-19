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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HubConnectionState } from '@microsoft/signalr';

import { formatMoney, localizedText } from '../../core/i18n/formatters';
import { LanguageService } from '../../core/i18n/language.service';
import { CustomerHeader } from '../../shared/customer-header/customer-header';
import { CartService } from '../customer-ordering/cart/cart.service';
import { RecentOrdersService } from '../customer-ordering/recent-orders.service';
import {
  CustomerOrderTracking,
  OrderStatus,
  OrderType,
  ReorderPreview,
  ReorderUnavailableItem,
} from './order-tracking.models';
import { TrackingApiService } from './tracking-api.service';
import { TrackingHubService } from './tracking-hub.service';

type PageState = 'loading' | 'no-credential' | 'error' | 'loaded';

interface StepDef {
  readonly key: OrderStatus;
  readonly label: () => string;
}

export interface ReorderFeedbackState {
  readonly type: 'success' | 'partial' | 'error';
  readonly message: string;
  readonly unavailableItems?: readonly ReorderUnavailableItem[];
}

@Component({
  selector: 'app-order-tracking-page',
  imports: [CustomerHeader, RouterLink],
  templateUrl: './order-tracking-page.html',
  styleUrl: './order-tracking-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TrackingHubService],
})
export class OrderTrackingPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(TrackingApiService);
  protected readonly cart = inject(CartService);
  private readonly recentOrders = inject(RecentOrdersService);
  protected readonly hub = inject(TrackingHubService);
  protected readonly HubConnectionState = HubConnectionState;
  private readonly destroyRef = inject(DestroyRef);
  private publicCode = '';

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly state = signal<PageState>('loading');
  protected readonly tracking = signal<CustomerOrderTracking | null>(null);
  protected readonly summaryOpen = signal(false);
  protected readonly connectionState = toSignal(this.hub.connectionState$, {
    initialValue: HubConnectionState.Disconnected,
  });
  protected readonly isReconnecting = computed(
    () => this.connectionState() === HubConnectionState.Reconnecting,
  );

  // Reorder state
  protected readonly reorderLoading = signal(false);
  protected readonly reorderFeedback = signal<ReorderFeedbackState | null>(null);
  protected readonly pendingReorderPreview = signal<ReorderPreview | null>(null);
  protected readonly showMergeDialog = signal(false);
  protected readonly showUnavailableDialog = signal(false);
  protected readonly unavailableDialogItems = signal<readonly ReorderUnavailableItem[]>([]);

  protected readonly deliverySteps: readonly StepDef[] = [
    { key: 'Pending', label: () => this.copy().orderTracking.steps.pending },
    { key: 'Confirmed', label: () => this.copy().orderTracking.steps.confirmed },
    { key: 'Preparing', label: () => this.copy().orderTracking.steps.preparing },
    { key: 'Ready', label: () => this.copy().orderTracking.steps.readyDelivery },
    { key: 'OnTheWay', label: () => this.copy().orderTracking.steps.onTheWay },
    { key: 'Delivered', label: () => this.copy().orderTracking.steps.delivered },
  ];

  protected readonly takeawaySteps: readonly StepDef[] = [
    { key: 'Pending', label: () => this.copy().orderTracking.steps.pending },
    { key: 'Confirmed', label: () => this.copy().orderTracking.steps.confirmed },
    { key: 'Preparing', label: () => this.copy().orderTracking.steps.preparing },
    { key: 'Ready', label: () => this.copy().orderTracking.steps.readyTakeaway },
    { key: 'Delivered', label: () => this.copy().orderTracking.steps.delivered },
  ];

  protected readonly currentSteps = computed(() => {
    const t = this.tracking();
    if (!t) return this.deliverySteps;
    return t.orderType === 'Delivery' ? this.deliverySteps : this.takeawaySteps;
  });

  protected readonly statusWording = computed(() => {
    const t = this.tracking();
    if (!t) return '';
    const steps = this.copy().orderTracking.steps;
    switch (t.status) {
      case 'Pending':
        return steps.pending;
      case 'Confirmed':
        return steps.confirmed;
      case 'Preparing':
        return steps.preparing;
      case 'Ready':
        return t.orderType === 'Delivery' ? steps.readyDelivery : steps.readyTakeaway;
      case 'OnTheWay':
        return steps.onTheWay;
      case 'Delivered':
        return steps.delivered;
      default:
        return '';
    }
  });

  ngOnInit(): void {
    this.publicCode = (this.route.snapshot.params['publicCode'] as string | undefined) ?? '';

    if (!this.publicCode) {
      this.state.set('no-credential');
      return;
    }

    // Set up hub event listeners once
    this.hub.trackingUpdate$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.tracking.set(data);
      if (data.status === 'Delivered' && this.recentOrders.activeOrderCode() === this.publicCode) {
        this.recentOrders.setActiveOrderCode(null);
      }
    });

    this.hub.reconnected$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.api
        .getTracking(this.publicCode)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            this.tracking.set(data);
            if (
              data.status === 'Delivered' &&
              this.recentOrders.activeOrderCode() === this.publicCode
            ) {
              this.recentOrders.setActiveOrderCode(null);
            }
          },
          error: () => undefined,
        });
    });

    this.loadTracking();
  }

  ngOnDestroy(): void {
    void this.hub.stopConnection();
  }

  protected loadTracking(): void {
    this.state.set('loading');
    this.api
      .getTracking(this.publicCode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.tracking.set(data);
          this.state.set('loaded');
          this.recentOrders.registerOrder(this.publicCode);
          if (data.status !== 'Delivered') {
            this.recentOrders.setActiveOrderCode(this.publicCode);
          } else if (this.recentOrders.activeOrderCode() === this.publicCode) {
            this.recentOrders.setActiveOrderCode(null);
          }
          void this.hub.startConnection(this.publicCode).catch(() => undefined);
        },
        error: () => {
          this.state.set('error');
        },
      });
  }

  protected toggleSummary(): void {
    this.summaryOpen.update((v) => !v);
  }

  protected getStepClass(
    stepKey: OrderStatus,
    currentStatus: OrderStatus,
    timeline: readonly { readonly status: OrderStatus }[],
  ): 'completed' | 'current' | 'pending' {
    if (stepKey === currentStatus) return 'current';
    const statusOrder: readonly OrderStatus[] = [
      'Pending',
      'Confirmed',
      'Preparing',
      'Ready',
      'OnTheWay',
      'Delivered',
    ];
    const stepIdx = statusOrder.indexOf(stepKey);
    const currentIdx = statusOrder.indexOf(currentStatus);
    const inTimeline = timeline.some((e) => e.status === stepKey);
    if (inTimeline || stepIdx < currentIdx) return 'completed';
    return 'pending';
  }

  protected formatMoney(value: number): string {
    return formatMoney(value, this.language.current());
  }

  protected localizedText(arabic: string | null, english: string | null): string {
    return localizedText(this.language.current(), arabic ?? '', english ?? '');
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.language.current() === 'ar' ? 'ar-EG' : 'en-EG', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  }

  protected orderTypeLabel(type: OrderType): string {
    return type === 'Takeaway' ? this.copy().common.takeaway : this.copy().common.delivery;
  }

  protected onReorder(): void {
    if (!this.publicCode || this.reorderLoading()) {
      return;
    }

    this.reorderLoading.set(true);
    this.reorderFeedback.set(null);

    this.api
      .reorderPreview(this.publicCode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preview) => {
          this.reorderLoading.set(false);

          if (preview.eligibleItems.length === 0) {
            this.unavailableDialogItems.set(preview.unavailableItems);
            this.showUnavailableDialog.set(true);
            return;
          }

          if (this.cart.items().length > 0) {
            this.pendingReorderPreview.set(preview);
            this.showMergeDialog.set(true);
          } else {
            this.applyReorder(preview, 'merge');
          }
        },
        error: () => {
          this.reorderLoading.set(false);
          this.reorderFeedback.set({
            type: 'error',
            message: this.copy().orderTracking.reorder.errorToast,
          });
        },
      });
  }

  protected confirmMerge(): void {
    const preview = this.pendingReorderPreview();
    if (preview) {
      this.applyReorder(preview, 'merge');
      this.closeMergeDialog();
    }
  }

  protected confirmReplace(): void {
    const preview = this.pendingReorderPreview();
    if (preview) {
      this.applyReorder(preview, 'replace');
      this.closeMergeDialog();
    }
  }

  protected closeMergeDialog(): void {
    this.showMergeDialog.set(false);
    this.pendingReorderPreview.set(null);
  }

  protected closeUnavailableDialog(): void {
    this.showUnavailableDialog.set(false);
    this.unavailableDialogItems.set([]);
  }

  protected dismissFeedback(): void {
    this.reorderFeedback.set(null);
  }

  protected getUnavailableReasonText(reason: string): string {
    if (reason === 'SoldOut') {
      return this.copy().orderTracking.reorder.unavailableReasons.soldOut;
    }
    return this.copy().orderTracking.reorder.unavailableReasons.unavailable;
  }

  private applyReorder(preview: ReorderPreview, mode: 'merge' | 'replace'): void {
    const items = preview.eligibleItems.map((item) => ({
      menuItemId: item.menuItemId,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      imageReference: item.imageReference,
      unitPrice: item.currentPrice,
      quantity: item.quantity,
    }));

    if (mode === 'merge') {
      this.cart.mergeItems(items);
    } else {
      this.cart.replaceItems(items);
    }

    if (preview.unavailableItems.length > 0) {
      this.reorderFeedback.set({
        type: 'partial',
        message: this.copy().orderTracking.reorder.partialSuccessNotice,
        unavailableItems: preview.unavailableItems,
      });
    } else {
      this.reorderFeedback.set({
        type: 'success',
        message: this.copy().orderTracking.reorder.successToast,
      });
    }
  }
}
