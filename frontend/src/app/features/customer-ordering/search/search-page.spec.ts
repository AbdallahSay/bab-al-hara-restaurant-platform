import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { CustomerApiService } from '../customer-api.service';
import { MenuItem } from '../order.models';
import { SearchPage } from './search-page';

const dummyItems: MenuItem[] = [
  {
    id: 'item-1',
    nameAr: 'مشكل مشاوي باب الحارة',
    nameEn: 'Bab Al Hara Mixed Grill',
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
    nameAr: 'سندوتش كفتة شامي',
    nameEn: 'Kofta Sandwich',
    descriptionAr: 'كفتة مشوية على الفحم مع طحينة',
    descriptionEn: 'Charcoal grilled kofta with tahini',
    price: 85,
    categoryId: 'cat-2',
    imageReference: '/images/menu/kofta-sandwich.webp',
    isAvailable: true,
    preparationMinutes: 10,
  },
];

describe('SearchPage', () => {
  let fixture: ComponentFixture<SearchPage>;

  beforeEach(async () => {
    globalThis.localStorage.clear();

    const apiMock = {
      getMenuItems: () => of(dummyItems),
      getCategories: () => of([]),
    };

    await TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [provideRouter([]), { provide: CustomerApiService, useValue: apiMock }],
    }).compileComponents();
  });

  it('renders all items by default', () => {
    fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.search-card').length).toBe(2);
  });

  it('filters items when search input is provided', () => {
    fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.search-input') as HTMLInputElement;
    input.value = 'سندوتش';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.search-card').length).toBe(1);
    expect(compiled.querySelector('.item-name')?.textContent).toContain('سندوتش');
  });

  it('shows empty state when no items match', () => {
    fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.search-input') as HTMLInputElement;
    input.value = 'بيتزا غير موجودة';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.search-empty')).not.toBeNull();
    expect(compiled.querySelectorAll('.search-card').length).toBe(0);
  });
});
