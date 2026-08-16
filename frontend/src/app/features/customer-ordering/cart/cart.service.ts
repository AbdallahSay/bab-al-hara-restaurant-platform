import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { MenuItem } from '../order.models';

const CART_STORAGE_KEY = 'bab-al-hara.cart.v1';

export interface CartItem {
  readonly menuItemId: string;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly imageReference: string;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly isAvailable: boolean;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly items = signal<readonly CartItem[]>(this.readStoredCart());
  readonly itemCount = computed(() =>
    this.items().reduce((count, item) => count + item.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.items().reduce((total, item) => total + item.unitPrice * item.quantity, 0),
  );

  constructor() {
    effect(() => {
      if (this.isBrowser) {
        globalThis.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items()));
      }
    });
  }

  add(menuItem: MenuItem): 'added' | 'updated' | false {
    if (!menuItem.isAvailable) {
      return false;
    }

    const existing = this.items().find((item) => item.menuItemId === menuItem.id);
    if (existing) {
      this.changeQuantity(menuItem.id, existing.quantity + 1);
      return 'updated';
    }

    this.items.update((items) => [
      ...items,
      {
        menuItemId: menuItem.id,
        nameAr: menuItem.nameAr,
        nameEn: menuItem.nameEn,
        imageReference: menuItem.imageReference,
        unitPrice: menuItem.price,
        quantity: 1,
        isAvailable: true,
      },
    ]);
    return 'added';
  }

  increase(menuItemId: string): void {
    const item = this.items().find((candidate) => candidate.menuItemId === menuItemId);
    if (item && item.quantity < 99) {
      this.changeQuantity(menuItemId, item.quantity + 1);
    }
  }

  decrease(menuItemId: string): void {
    const item = this.items().find((candidate) => candidate.menuItemId === menuItemId);
    if (!item) {
      return;
    }

    if (item.quantity === 1) {
      this.remove(menuItemId);
      return;
    }

    this.changeQuantity(menuItemId, item.quantity - 1);
  }

  remove(menuItemId: string): void {
    this.items.update((items) => items.filter((item) => item.menuItemId !== menuItemId));
  }

  clear(): void {
    this.items.set([]);
  }

  syncCatalog(menuItems: readonly MenuItem[]): void {
    const catalog = new Map(menuItems.map((item) => [item.id, item]));
    this.items.update((items) =>
      items.map((item) => {
        const current = catalog.get(item.menuItemId);
        return current
          ? {
              ...item,
              nameAr: current.nameAr,
              nameEn: current.nameEn,
              imageReference: current.imageReference,
              unitPrice: current.price,
              isAvailable: current.isAvailable,
            }
          : { ...item, isAvailable: false };
      }),
    );
  }

  private changeQuantity(menuItemId: string, quantity: number): void {
    this.items.update((items) =>
      items.map((item) => (item.menuItemId === menuItemId ? { ...item, quantity } : item)),
    );
  }

  private readStoredCart(): readonly CartItem[] {
    if (!this.isBrowser) {
      return [];
    }

    try {
      const value = globalThis.localStorage.getItem(CART_STORAGE_KEY);
      if (!value) {
        return [];
      }

      const items = JSON.parse(value) as CartItem[];
      return Array.isArray(items)
        ? items.filter(
            (item) =>
              typeof item.menuItemId === 'string' &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0 &&
              item.quantity <= 99 &&
              Number.isFinite(item.unitPrice) &&
              item.unitPrice >= 0,
          )
        : [];
    } catch {
      return [];
    }
  }
}
