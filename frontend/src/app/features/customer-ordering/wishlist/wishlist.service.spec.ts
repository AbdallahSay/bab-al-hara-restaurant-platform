import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { MenuItem } from '../order.models';
import { WishlistService } from './wishlist.service';

const dummyItem: MenuItem = {
  id: 'item-101',
  nameAr: 'شاورما دجاج',
  nameEn: 'Chicken Shawarma',
  descriptionAr: 'شاورما سورية أصلية',
  descriptionEn: 'Authentic Syrian shawarma',
  price: 75,
  categoryId: 'cat-1',
  imageReference: '/images/menu/mixed-grill.webp',
  isAvailable: true,
  preparationMinutes: 15,
};

describe('WishlistService', () => {
  let service: WishlistService;

  beforeEach(() => {
    globalThis.localStorage.clear();
    TestBed.configureTestingModule({
      providers: [WishlistService],
    });
    service = TestBed.inject(WishlistService);
  });

  it('starts with an empty wishlist', () => {
    expect(service.favoriteItemIds()).toEqual([]);
    expect(service.count()).toBe(0);
  });

  it('toggles item in and out of wishlist', () => {
    const added = service.toggle(dummyItem);
    expect(added).toBe(true);
    expect(service.isFavorite(dummyItem.id)).toBe(true);
    expect(service.count()).toBe(1);

    const removed = service.toggle(dummyItem);
    expect(removed).toBe(false);
    expect(service.isFavorite(dummyItem.id)).toBe(false);
    expect(service.count()).toBe(0);
  });

  it('removes item directly', () => {
    service.toggle(dummyItem);
    expect(service.count()).toBe(1);

    service.remove(dummyItem.id);
    expect(service.isFavorite(dummyItem.id)).toBe(false);
    expect(service.count()).toBe(0);
  });

  it('clears all favorites', () => {
    service.toggle(dummyItem);
    service.toggle({ ...dummyItem, id: 'item-102' });
    expect(service.count()).toBe(2);

    service.clear();
    expect(service.count()).toBe(0);
  });
});
