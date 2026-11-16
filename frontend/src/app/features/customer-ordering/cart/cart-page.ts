import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { formatMoney, localizedText } from '../../../core/i18n/formatters';
import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerFooter } from '../../../shared/customer-footer/customer-footer';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';
import { RestaurantPausedBanner } from '../../../shared/restaurant-paused-banner/restaurant-paused-banner';
import { CartItem, CartService } from './cart.service';
import { RestaurantStatusService } from '../restaurant-status.service';

@Component({
  selector: 'app-cart-page',
  imports: [CustomerHeader, CustomerFooter, RestaurantPausedBanner, RouterLink],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly cart = inject(CartService);
  protected readonly statusService = inject(RestaurantStatusService);

  protected readonly hasUnavailableItems = computed(() =>
    this.cart.items().some((item) => !item.isAvailable),
  );

  ngOnInit(): void {
    this.statusService.loadStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected itemName(item: CartItem): string {
    return localizedText(this.language.current(), item.nameAr, item.nameEn);
  }

  protected money(value: number): string {
    return formatMoney(value, this.language.current());
  }
}
