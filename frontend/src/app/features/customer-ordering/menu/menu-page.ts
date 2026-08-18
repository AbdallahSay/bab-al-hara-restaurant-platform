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
import { forkJoin } from 'rxjs';

import { formatMoney, localizedText } from '../../../core/i18n/formatters';
import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';
import { RestaurantPausedBanner } from '../../../shared/restaurant-paused-banner/restaurant-paused-banner';
import { CartService } from '../cart/cart.service';
import { CartToastService } from '../cart/cart-toast.service';
import { CustomerApiService } from '../customer-api.service';
import { Category, MenuItem } from '../order.models';
import { RestaurantStatusService } from '../restaurant-status.service';

type MenuState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-menu-page',
  imports: [CustomerHeader, RestaurantPausedBanner, RouterLink],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage implements OnInit {
  private readonly api = inject(CustomerApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly cart = inject(CartService);
  protected readonly statusService = inject(RestaurantStatusService);
  private readonly cartToast = inject(CartToastService);
  protected readonly state = signal<MenuState>('loading');
  protected readonly addedItemIds = signal<Set<string>>(new Set());
  protected readonly categories = signal<readonly Category[]>([]);
  protected readonly items = signal<readonly MenuItem[]>([]);
  protected readonly selectedCategoryId = signal<string | null>(null);
  protected readonly announcement = signal('');
  protected readonly visibleItems = computed(() => {
    const categoryId = this.selectedCategoryId();
    return categoryId
      ? this.items().filter((item) => item.categoryId === categoryId)
      : this.items();
  });

  ngOnInit(): void {
    this.loadMenu();
  }

  protected loadMenu(): void {
    this.state.set('loading');
    forkJoin({
      categories: this.api.getCategories(),
      items: this.api.getMenuItems(),
      status: this.statusService.loadStatus(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories, items }) => {
          this.categories.set(categories);
          this.items.set(items);
          this.cart.syncCatalog(items);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  protected selectCategory(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
  }

  protected addToCart(item: MenuItem): void {
    const inFlight = this.addedItemIds();
    if (inFlight.has(item.id)) {
      return;
    }

    const result = this.cart.add(item);
    if (result) {
      // Debounce logic / visual state
      const newSet = new Set(inFlight);
      newSet.add(item.id);
      this.addedItemIds.set(newSet);

      setTimeout(() => {
        const currentSet = new Set(this.addedItemIds());
        currentSet.delete(item.id);
        this.addedItemIds.set(currentSet);
      }, 2000);

      // Toast feedback
      this.cartToast.showAddedToast(
        this.itemName(item),
        result === 'updated',
        this.language.current(),
      );

      // Screen reader announcement (kept existing behavior)
      this.announcement.set(`${this.itemName(item)} — ${this.copy().menu.added}`);
    }
  }

  protected getButtonText(item: MenuItem): string {
    if (!item.isAvailable) return this.copy().common.unavailable;
    if (this.addedItemIds().has(item.id)) {
      return this.language.current() === 'ar' ? '✓ تمت الإضافة' : '✓ Added';
    }
    return this.copy().menu.add;
  }

  protected itemName(item: MenuItem): string {
    return localizedText(this.language.current(), item.nameAr, item.nameEn);
  }

  protected itemDescription(item: MenuItem): string {
    return localizedText(this.language.current(), item.descriptionAr, item.descriptionEn);
  }

  protected categoryName(category: Category): string {
    return localizedText(this.language.current(), category.nameAr, category.nameEn);
  }

  protected money(value: number): string {
    return formatMoney(value, this.language.current());
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.includes('/images/menu/default.webp')) {
      img.src = '/images/menu/default.webp';
    }
  }
}
