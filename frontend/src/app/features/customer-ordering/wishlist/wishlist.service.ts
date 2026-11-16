import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { MenuItem } from '../order.models';

const WISHLIST_STORAGE_KEY = 'bab-al-hara.wishlist.v1';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly favoriteItemIds = signal<readonly string[]>(this.readStoredWishlist());
  readonly count = computed(() => this.favoriteItemIds().length);

  constructor() {
    effect(() => {
      if (this.isBrowser) {
        globalThis.localStorage.setItem(
          WISHLIST_STORAGE_KEY,
          JSON.stringify(this.favoriteItemIds()),
        );
      }
    });
  }

  isFavorite(itemId: string): boolean {
    return this.favoriteItemIds().includes(itemId);
  }

  toggle(menuItem: MenuItem): boolean {
    const isCurrentlyFavorite = this.isFavorite(menuItem.id);
    if (isCurrentlyFavorite) {
      this.favoriteItemIds.update((ids) => ids.filter((id) => id !== menuItem.id));
      return false;
    }

    this.favoriteItemIds.update((ids) => [...ids, menuItem.id]);
    return true;
  }

  remove(itemId: string): void {
    this.favoriteItemIds.update((ids) => ids.filter((id) => id !== itemId));
  }

  clear(): void {
    this.favoriteItemIds.set([]);
  }

  private readStoredWishlist(): readonly string[] {
    if (!this.isBrowser) {
      return [];
    }

    try {
      const raw = globalThis.localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
      return [];
    }
  }
}
