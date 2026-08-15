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
import { CartService } from '../cart/cart.service';
import { CustomerApiService } from '../customer-api.service';
import { Category, MenuItem } from '../order.models';

type MenuState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-menu-page',
  imports: [CustomerHeader, RouterLink],
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
  protected readonly state = signal<MenuState>('loading');
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
    forkJoin({ categories: this.api.getCategories(), items: this.api.getMenuItems() })
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
    if (this.cart.add(item)) {
      this.announcement.set(`${this.itemName(item)} — ${this.copy().menu.added}`);
    }
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
}
