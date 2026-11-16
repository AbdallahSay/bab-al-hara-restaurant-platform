import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { LanguageService } from '../../core/i18n/language.service';
import { Language } from '../../core/i18n/translations';
import { CartService } from '../../features/customer-ordering/cart/cart.service';
import { RecentOrdersService } from '../../features/customer-ordering/recent-orders.service';
import { WishlistService } from '../../features/customer-ordering/wishlist/wishlist.service';

@Component({
  selector: 'app-customer-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './customer-header.html',
  styleUrl: './customer-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerHeader {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly cart = inject(CartService);
  protected readonly wishlist = inject(WishlistService);
  private readonly recentOrders = inject(RecentOrdersService);

  protected readonly activeOrderCode = this.recentOrders.activeOrderCode;
  protected readonly isMobileMenuOpen = signal(false);

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected setLanguage(language: Language): void {
    this.language.setLanguage(language);
  }
}
