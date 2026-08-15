import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CustomerApiService } from '../customer-api.service';
import { Category, MenuItem } from '../order.models';
import { MenuPage } from './menu-page';

const CATEGORY: Category = {
  id: 'category-1',
  nameAr: 'السندوتشات',
  nameEn: 'Sandwiches',
  displayOrder: 1,
};
const ITEMS: readonly MenuItem[] = [
  {
    id: 'item-1',
    categoryId: CATEGORY.id,
    nameAr: 'سندوتش كفتة',
    nameEn: 'Kofta sandwich',
    descriptionAr: 'كفتة مشوية',
    descriptionEn: 'Grilled kofta',
    price: 85,
    imageReference: '/images/menu/kofta-sandwich.webp',
    preparationMinutes: 14,
    isAvailable: true,
  },
  {
    id: 'item-2',
    categoryId: CATEGORY.id,
    nameAr: 'تمر هندي',
    nameEn: 'Tamarind',
    descriptionAr: 'مشروب شرقي',
    descriptionEn: 'Traditional drink',
    price: 35,
    imageReference: '/images/menu/tamarind.webp',
    preparationMinutes: 3,
    isAvailable: false,
  },
];

describe('MenuPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the Arabic menu by default', async () => {
    await configure({
      getCategories: () => of([CATEGORY]),
      getMenuItems: () => of(ITEMS),
    });
    const fixture = TestBed.createComponent(MenuPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('اختر طلبك');
    expect(fixture.nativeElement.textContent).toContain('سندوتش كفتة');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('switches the same menu implementation to English LTR', async () => {
    await configure({
      getCategories: () => of([CATEGORY]),
      getMenuItems: () => of(ITEMS),
    });
    const fixture = TestBed.createComponent(MenuPage);
    fixture.detectChanges();

    const english: HTMLButtonElement = fixture.nativeElement.querySelector('[data-language="en"]');
    english.click();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Choose your meal');
    expect(fixture.nativeElement.textContent).toContain('Kofta sandwich');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('blocks the unavailable item and exposes a text status', async () => {
    await configure({
      getCategories: () => of([CATEGORY]),
      getMenuItems: () => of(ITEMS),
    });
    const fixture = TestBed.createComponent(MenuPage);
    fixture.detectChanges();

    const unavailableCard: HTMLElement =
      fixture.nativeElement.querySelector('.menu-item--unavailable');
    const button: HTMLButtonElement = unavailableCard.querySelector('button')!;
    expect(button.disabled).toBe(true);
    expect(unavailableCard.textContent).toContain('غير متاح حالياً');
  });

  it('adds an available item and shows the reachable cart', async () => {
    await configure({
      getCategories: () => of([CATEGORY]),
      getMenuItems: () => of(ITEMS),
    });
    const fixture = TestBed.createComponent(MenuPage);
    fixture.detectChanges();

    const add: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.menu-item:not(.menu-item--unavailable) .button--primary',
    );
    add.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.mobile-cart')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.cart-link strong').textContent).toContain('1');
  });

  it('shows a retryable failure when the menu request fails', async () => {
    await configure({
      getCategories: () => of([CATEGORY]),
      getMenuItems: () => throwError(() => new Error('offline')),
    });
    const fixture = TestBed.createComponent(MenuPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('تعذر تحميل القائمة');
  });

  async function configure(api: Partial<CustomerApiService>): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [MenuPage],
      providers: [provideRouter([]), { provide: CustomerApiService, useValue: api }],
    }).compileComponents();
  }
});
