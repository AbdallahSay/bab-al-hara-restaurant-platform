import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { formatMoney, localizedText } from '../../../core/i18n/formatters';
import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';
import { CartService } from '../cart/cart.service';
import { RecentOrdersService } from '../recent-orders.service';
import {
  CustomerOrderTracking,
  OrderStatus,
  OrderType,
  ReorderPreview,
  ReorderUnavailableItem,
} from '../../order-tracking/order-tracking.models';
import { TrackingApiService } from '../../order-tracking/tracking-api.service';

export interface InaccessibleOrderSummary {
  readonly publicCode: string;
  readonly lastSeenAtUtc: string;
}

export interface ReorderFeedbackState {
  readonly type: 'success' | 'partial' | 'error';
  readonly message: string;
  readonly unavailableItems?: readonly ReorderUnavailableItem[];
}

@Component({
  selector: 'app-my-orders-page',
  imports: [CustomerHeader, RouterLink],
  templateUrl: './my-orders-page.html',
  styleUrl: './my-orders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyOrdersPage implements OnInit {
  private readonly api = inject(TrackingApiService);
  protected readonly cart = inject(CartService);
  private readonly recentOrdersService = inject(RecentOrdersService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;

  protected readonly loading = signal(true);
  protected readonly activeOrders = signal<readonly CustomerOrderTracking[]>([]);
  protected readonly previousOrders = signal<readonly CustomerOrderTracking[]>([]);
  protected readonly inaccessibleOrders = signal<readonly InaccessibleOrderSummary[]>([]);

  // Reorder flow state
  protected readonly reorderLoadingCode = signal<string | null>(null);
  protected readonly reorderFeedback = signal<ReorderFeedbackState | null>(null);
  protected readonly pendingReorderPreview = signal<ReorderPreview | null>(null);
  protected readonly showMergeDialog = signal(false);
  protected readonly showUnavailableDialog = signal(false);
  protected readonly unavailableDialogItems = signal<readonly ReorderUnavailableItem[]>([]);

  protected readonly hasAnyOrders = computed(
    () =>
      this.activeOrders().length > 0 ||
      this.previousOrders().length > 0 ||
      this.inaccessibleOrders().length > 0,
  );

  ngOnInit(): void {
    this.loadRecentOrders();
  }

  protected loadRecentOrders(): void {
    const stored = this.recentOrdersService.orders();
    if (stored.length === 0) {
      this.loading.set(false);
      this.activeOrders.set([]);
      this.previousOrders.set([]);
      this.inaccessibleOrders.set([]);
      return;
    }

    this.loading.set(true);

    const requests = stored.map((entry) =>
      this.api.getTracking(entry.publicCode).pipe(catchError(() => of(null))),
    );

    forkJoin(requests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          const active: CustomerOrderTracking[] = [];
          const previous: CustomerOrderTracking[] = [];
          const inaccessible: InaccessibleOrderSummary[] = [];

          results.forEach((order, index) => {
            const entry = stored[index];
            if (!order) {
              if (entry) {
                inaccessible.push(entry);
              }
            } else if (order.status === 'Delivered') {
              previous.push(order);
            } else {
              active.push(order);
            }
          });

          this.activeOrders.set(active);
          this.previousOrders.set(previous);
          this.inaccessibleOrders.set(inaccessible);
          this.loading.set(false);

          // Update active order code if active orders exist
          const firstActive = active[0];
          if (firstActive) {
            this.recentOrdersService.setActiveOrderCode(firstActive.publicCode);
          } else if (
            this.recentOrdersService.activeOrderCode() &&
            !active.some((o) => o.publicCode === this.recentOrdersService.activeOrderCode())
          ) {
            this.recentOrdersService.setActiveOrderCode(null);
          }
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  protected removeInaccessibleOrder(publicCode: string): void {
    this.recentOrdersService.removeOrder(publicCode);
    this.inaccessibleOrders.update((list) => list.filter((item) => item.publicCode !== publicCode));
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

  protected statusBadgeLabel(status: OrderStatus): string {
    const key = this.statusStepKey(status);
    return this.copy().orderTracking.steps[key];
  }

  private statusStepKey(
    status: OrderStatus,
  ): 'pending' | 'confirmed' | 'preparing' | 'readyDelivery' | 'onTheWay' | 'delivered' {
    switch (status) {
      case 'Pending':
        return 'pending';
      case 'Confirmed':
        return 'confirmed';
      case 'Preparing':
        return 'preparing';
      case 'Ready':
        return 'readyDelivery';
      case 'OnTheWay':
        return 'onTheWay';
      case 'Delivered':
        return 'delivered';
      default:
        return 'pending';
    }
  }

  protected onReorder(publicCode: string): void {
    if (!publicCode || this.reorderLoadingCode()) {
      return;
    }

    this.reorderLoadingCode.set(publicCode);
    this.reorderFeedback.set(null);

    this.api
      .reorderPreview(publicCode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preview) => {
          this.reorderLoadingCode.set(null);

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
          this.reorderLoadingCode.set(null);
          this.reorderFeedback.set({
            type: 'error',
            message: this.copy().orderTracking.reorder.errorToast,
          });
        },
      });
  }

  protected onMergeConfirm(): void {
    const preview = this.pendingReorderPreview();
    if (preview) {
      this.applyReorder(preview, 'merge');
    }
    this.closeMergeDialog();
  }

  protected onReplaceConfirm(): void {
    const preview = this.pendingReorderPreview();
    if (preview) {
      this.applyReorder(preview, 'replace');
    }
    this.closeMergeDialog();
  }

  protected closeMergeDialog(): void {
    this.showMergeDialog.set(false);
    this.pendingReorderPreview.set(null);
  }

  protected closeUnavailableDialog(): void {
    this.showUnavailableDialog.set(false);
    this.unavailableDialogItems.set([]);
  }

  private applyReorder(preview: ReorderPreview, strategy: 'merge' | 'replace'): void {
    const cartItems = preview.eligibleItems.map((item) => ({
      menuItemId: item.menuItemId,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      imageReference: item.imageReference,
      unitPrice: item.currentPrice,
      quantity: item.quantity,
    }));

    if (strategy === 'replace') {
      this.cart.replaceItems(cartItems);
    } else {
      this.cart.mergeItems(cartItems);
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

  protected getUnavailableReason(reason: string): string {
    const reasons = this.copy().orderTracking.reorder.unavailableReasons;
    if (reason === 'SoldOut') return reasons.soldOut;
    if (reason === 'Inactive' || reason === 'NotFound') return reasons.unavailable;
    return reasons.unavailable;
  }
}
