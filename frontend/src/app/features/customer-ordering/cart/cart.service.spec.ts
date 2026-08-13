import { TestBed } from '@angular/core/testing';

import { MenuItem } from '../order.models';
import { CartService } from './cart.service';

const AVAILABLE_ITEM: MenuItem = {
  id: 'item-1',
  categoryId: 'category-1',
  nameAr: 'سندوتش كفتة',
  nameEn: 'Kofta sandwich',
  descriptionAr: 'كفتة مشوية',
  descriptionEn: 'Grilled kofta',
  price: 85,
  imageReference: '/images/menu/kofta-sandwich.webp',
  preparationMinutes: 14,
  isAvailable: true,
};

describe('CartService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('adds an available item and calculates the line subtotal', () => {
    const service = TestBed.inject(CartService);

    expect(service.add(AVAILABLE_ITEM)).toBe(true);

    expect(service.itemCount()).toBe(1);
    expect(service.subtotal()).toBe(85);
  });

  it('does not add an unavailable item', () => {
    const service = TestBed.inject(CartService);

    expect(service.add({ ...AVAILABLE_ITEM, isAvailable: false })).toBe(false);

    expect(service.items()).toEqual([]);
  });

  it('increases and decreases quantity with recalculated totals', () => {
    const service = TestBed.inject(CartService);
    service.add(AVAILABLE_ITEM);

    service.increase(AVAILABLE_ITEM.id);
    expect(service.itemCount()).toBe(2);
    expect(service.subtotal()).toBe(170);

    service.decrease(AVAILABLE_ITEM.id);
    expect(service.itemCount()).toBe(1);
    expect(service.subtotal()).toBe(85);
  });

  it('removes an item explicitly and when decrementing quantity one', () => {
    const service = TestBed.inject(CartService);
    service.add(AVAILABLE_ITEM);
    service.decrease(AVAILABLE_ITEM.id);
    expect(service.items()).toEqual([]);

    service.add(AVAILABLE_ITEM);
    service.remove(AVAILABLE_ITEM.id);
    expect(service.items()).toEqual([]);
  });

  it('persists cart contents to local storage', () => {
    const service = TestBed.inject(CartService);
    service.add(AVAILABLE_ITEM);
    TestBed.flushEffects();

    const stored = JSON.parse(localStorage.getItem('bab-al-hara.cart.v1') ?? '[]') as {
      menuItemId: string;
    }[];
    expect(stored[0]!.menuItemId).toBe(AVAILABLE_ITEM.id);
  });

  it('synchronizes current price and availability from the catalog', () => {
    const service = TestBed.inject(CartService);
    service.add(AVAILABLE_ITEM);

    service.syncCatalog([{ ...AVAILABLE_ITEM, price: 92, isAvailable: false }]);

    expect(service.items()[0]!.unitPrice).toBe(92);
    expect(service.items()[0]!.isAvailable).toBe(false);
    expect(service.subtotal()).toBe(92);
  });
});
