import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatMoney, localizedText } from '../../../core/i18n/formatters';
import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';
import { CartItem, CartService } from './cart.service';

@Component({
  selector: 'app-cart-page',
  imports: [CustomerHeader, RouterLink],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly cart = inject(CartService);
  protected readonly hasUnavailableItems = computed(() =>
    this.cart.items().some((item) => !item.isAvailable),
  );

  protected itemName(item: CartItem): string {
    return localizedText(this.language.current(), item.nameAr, item.nameEn);
  }

  protected money(value: number): string {
    return formatMoney(value, this.language.current());
  }
}
