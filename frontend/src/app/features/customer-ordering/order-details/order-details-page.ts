import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerFooter } from '../../../shared/customer-footer/customer-footer';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';
import { CartService } from '../cart/cart.service';
import {
  CustomerOrderTracking,
  OrderStatus,
  OrderType,
  TrackingOrderItem,
} from '../../order-tracking/order-tracking.models';
import { TrackingApiService } from '../../order-tracking/tracking-api.service';

type PageState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-order-details-page',
  standalone: true,
  imports: [CustomerHeader, CustomerFooter, RouterLink],
  templateUrl: './order-details-page.html',
  styleUrl: './order-details-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailsPage implements OnInit {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(TrackingApiService);
  private readonly cart = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<PageState>('loading');
  protected readonly order = signal<CustomerOrderTracking | null>(null);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const publicCode = params.get('publicCode');
      if (publicCode) {
        this.loadDetails(publicCode);
      } else {
        this.state.set('error');
      }
    });
  }

  private loadDetails(code: string): void {
    this.state.set('loading');
    this.api
      .getTracking(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.state.set('loaded');
        },
        error: () => {
          this.state.set('error');
        },
      });
  }

  itemName(item: TrackingOrderItem): string {
    return this.language.current() === 'ar' ? item.productNameAr : item.productNameEn;
  }

  formatStatus(status: OrderStatus, orderType: OrderType): string {
    const steps = this.copy().orderTracking.steps;
    switch (status) {
      case 'Pending':
        return steps.pending;
      case 'Confirmed':
        return steps.confirmed;
      case 'Preparing':
        return steps.preparing;
      case 'Ready':
        return orderType === 'Takeaway' ? steps.readyTakeaway : steps.readyDelivery;
      case 'OnTheWay':
        return steps.onTheWay;
      case 'Delivered':
        return steps.delivered;
      default:
        return status;
    }
  }

  onReorder(order: CustomerOrderTracking): void {
    this.api
      .reorderPreview(order.publicCode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preview) => {
          for (const item of preview.eligibleItems) {
            this.cart.add({
              id: item.menuItemId,
              nameAr: item.nameAr,
              nameEn: item.nameEn,
              descriptionAr: '',
              descriptionEn: '',
              price: item.currentPrice,
              categoryId: '',
              imageReference: item.imageReference,
              preparationMinutes: 15,
              isAvailable: true,
            });
          }
          this.router.navigate(['/cart']);
        },
        error: () => {
          this.router.navigate(['/cart']);
        },
      });
  }
}
