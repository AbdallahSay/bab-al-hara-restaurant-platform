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

import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerFooter } from '../../../shared/customer-footer/customer-footer';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';
import { CartService } from '../cart/cart.service';
import { CustomerApiService } from '../customer-api.service';
import { MenuItem } from '../order.models';
import { WishlistService } from '../wishlist/wishlist.service';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CustomerHeader, CustomerFooter],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage implements OnInit {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  private readonly api = inject(CustomerApiService);
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly allItems = signal<readonly MenuItem[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly selectedTag = signal<string | null>(null);
  protected readonly toastMessage = signal<string | null>(null);

  protected readonly filteredItems = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const tag = this.selectedTag();
    let items = this.allItems();

    if (tag) {
      items = items.filter((item) => {
        const text =
          `${item.nameAr} ${item.nameEn} ${item.descriptionAr} ${item.descriptionEn}`.toLowerCase();
        return text.includes(tag.toLowerCase());
      });
    }

    if (query) {
      items = items.filter((item) => {
        const text =
          `${item.nameAr} ${item.nameEn} ${item.descriptionAr} ${item.descriptionEn}`.toLowerCase();
        return text.includes(query);
      });
    }

    return items;
  });

  protected readonly resultsCountText = computed(() => {
    const count = this.filteredItems().length;
    return this.copy().search.resultsCount.replace('{count}', count.toString());
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

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  selectTag(tag: string | null): void {
    this.selectedTag.set(tag);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.selectedTag.set(null);
  }

  itemName(item: MenuItem): string {
    return this.language.current() === 'ar' ? item.nameAr : item.nameEn;
  }

  itemDescription(item: MenuItem): string {
    return this.language.current() === 'ar' ? item.descriptionAr : item.descriptionEn;
  }

  isFavorite(itemId: string): boolean {
    return this.wishlist.isFavorite(itemId);
  }

  toggleWishlist(item: MenuItem): void {
    const added = this.wishlist.toggle(item);
    if (added) {
      this.showToast(this.copy().wishlist.title);
    }
  }

  addToCart(item: MenuItem): void {
    this.cart.add(item);
    this.showToast(this.copy().menu.addedToast);
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
