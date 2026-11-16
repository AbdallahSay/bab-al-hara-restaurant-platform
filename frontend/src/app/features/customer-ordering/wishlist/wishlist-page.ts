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

import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerFooter } from '../../../shared/customer-footer/customer-footer';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';
import { CartService } from '../cart/cart.service';
import { CustomerApiService } from '../customer-api.service';
import { MenuItem } from '../order.models';
import { WishlistService } from './wishlist.service';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [CustomerHeader, CustomerFooter, RouterLink],
  templateUrl: './wishlist-page.html',
  styleUrl: './wishlist-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistPage implements OnInit {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  private readonly api = inject(CustomerApiService);
  private readonly cart = inject(CartService);
  protected readonly wishlist = inject(WishlistService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly allItems = signal<readonly MenuItem[]>([]);
  protected readonly toastMessage = signal<string | null>(null);

  protected readonly favoriteItems = computed(() => {
    const ids = this.wishlist.favoriteItemIds();
    return this.allItems().filter((item) => ids.includes(item.id));
  });

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.loading.set(true);
    this.api
      .getMenuItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items: readonly MenuItem[]) => {
          this.allItems.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  itemName(item: MenuItem): string {
    return this.language.current() === 'ar' ? item.nameAr : item.nameEn;
  }

  itemDescription(item: MenuItem): string {
    return this.language.current() === 'ar' ? item.descriptionAr : item.descriptionEn;
  }

  removeFromWishlist(itemId: string): void {
    this.wishlist.remove(itemId);
  }

  addToCart(item: MenuItem): void {
    this.cart.add(item);
    this.showToast(this.copy().menu.addedToast);
  }

  addAllToCart(): void {
    let count = 0;
    for (const item of this.favoriteItems()) {
      if (item.isAvailable) {
        this.cart.add(item);
        count++;
      }
    }
    if (count > 0) {
      this.showToast(this.copy().wishlist.addAllSuccess);
    }
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/menu/mixed-grill.webp';
  }
}
