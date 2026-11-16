import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { CustomerApiService } from '../customer-api.service';
import { MenuItem } from '../order.models';
import { WishlistPage } from './wishlist-page';
import { WishlistService } from './wishlist.service';

const dummyItems: MenuItem[] = [
  {
    id: 'item-1',
    nameAr: 'مشكل مشاوي',
    nameEn: 'Mixed Grill',
    descriptionAr: 'كباب وشيش وكفتة',
    descriptionEn: 'Kebab, shish and kofta',
    price: 295,
    categoryId: 'cat-1',
    imageReference: '/images/menu/mixed-grill.webp',
    isAvailable: true,
    preparationMinutes: 25,
  },
  {
    id: 'item-2',
    nameAr: 'نصف فرخة مشوية',
    nameEn: 'Half Grilled Chicken',
    descriptionAr: 'على الفحم مع أرز وتومية',
    descriptionEn: 'Charcoal grilled with rice',
    price: 180,
    categoryId: 'cat-1',
    imageReference: '/images/menu/grilled-chicken.webp',
    isAvailable: true,
    preparationMinutes: 20,
  },
];

describe('WishlistPage', () => {
  let fixture: ComponentFixture<WishlistPage>;
  let wishlistService: WishlistService;

  beforeEach(async () => {
    globalThis.localStorage.clear();

    const apiMock = {
      getMenuItems: () => of(dummyItems),
      getCategories: () => of([]),
    };

    await TestBed.configureTestingModule({
      imports: [WishlistPage],
      providers: [provideRouter([]), { provide: CustomerApiService, useValue: apiMock }],
    }).compileComponents();

    wishlistService = TestBed.inject(WishlistService);
  });

  it('renders empty wishlist state initially', () => {
    fixture = TestBed.createComponent(WishlistPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.wishlist-empty')).not.toBeNull();
    expect(compiled.querySelectorAll('.wishlist-card').length).toBe(0);
  });

  it('renders favorite item cards when items exist in wishlist', () => {
    const item = dummyItems[0];
    if (item) {
      wishlistService.toggle(item);
    }

    fixture = TestBed.createComponent(WishlistPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.wishlist-card').length).toBe(1);
    expect(compiled.querySelector('.item-name')?.textContent).toContain('مشكل مشاوي');
  });
});
