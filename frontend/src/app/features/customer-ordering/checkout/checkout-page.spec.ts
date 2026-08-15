import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CartService } from '../cart/cart.service';
import { CustomerApiService } from '../customer-api.service';
import { CreatedOrder, MenuItem } from '../order.models';
import { OrderReceiptService } from '../success/order-receipt.service';
import { CheckoutPage } from './checkout-page';

const ITEM: MenuItem = {
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
const ORDER: CreatedOrder = {
  publicCode: 'BH-TEST-123',
  createdAt: '2026-08-13T18:00:00Z',
  orderType: 'Takeaway',
  status: 'Pending',
  deliveryAreaNameAr: null,
  deliveryAreaNameEn: null,
  address: null,
  subtotal: 85,
  deliveryFee: 0,
  total: 85,
  paymentMethod: 'Cash',
  paymentStatus: 'Pending',
};

describe('CheckoutPage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('shows required validation errors and rejects an invalid Egyptian phone', async () => {
    const fixture = await createFixture({ createOrder: () => of(ORDER) });
    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#customer-name').getAttribute('aria-invalid')).toBe(
      'true',
    );
    expect(
      fixture.nativeElement.querySelector('#customer-phone').getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('submits a valid Takeaway order without delivery details', async () => {
    let body: unknown;
    const fixture = await createFixture({
      createOrder: (request: unknown) => {
        body = request;
        return of(ORDER);
      },
    });
    fillContact(fixture);

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(body).toMatchObject({
      orderType: 'Takeaway',
      deliveryAreaId: null,
      address: null,
      items: [{ menuItemId: ITEM.id, quantity: 1 }],
    });
  });

  it('requires an active area and address for Delivery', async () => {
    const fixture = await createFixture({ createOrder: () => of(ORDER) });
    fillContact(fixture);
    const delivery: HTMLInputElement =
      fixture.nativeElement.querySelector('input[value="Delivery"]');
    delivery.click();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('اختر منطقة توصيل');
    expect(fixture.nativeElement.textContent).toContain('اكتب عنوان التوصيل بالتفصيل');
  });

  it('stores the successful authoritative response and clears the cart', async () => {
    const fixture = await createFixture({ createOrder: () => of(ORDER) });
    const cart = TestBed.inject(CartService);
    const receipt = TestBed.inject(OrderReceiptService);
    fillContact(fixture);

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(receipt.current()?.order.publicCode).toBe('BH-TEST-123');
    expect(cart.items()).toEqual([]);
  });

  it('keeps the cart and explains an unavailable-item API failure', async () => {
    const fixture = await createFixture({
      createOrder: () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              error: { code: 'unavailable_menu_item' },
            }),
        ),
    });
    const cart = TestBed.inject(CartService);
    fillContact(fixture);

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'لم يعد متاحاً',
    );
    expect(cart.items()).toHaveLength(1);
  });

  async function createFixture(apiOverrides: Partial<CustomerApiService>) {
    await TestBed.configureTestingModule({
      imports: [CheckoutPage],
      providers: [
        provideRouter([]),
        {
          provide: CustomerApiService,
          useValue: {
            getDeliveryAreas: () =>
              of([
                {
                  id: 'area-1',
                  nameAr: 'مدينة نصر',
                  nameEn: 'Nasr City',
                  deliveryFee: 35,
                  estimatedDeliveryMinutes: 45,
                },
              ]),
            ...apiOverrides,
          },
        },
      ],
    }).compileComponents();
    const cart = TestBed.inject(CartService);
    cart.add(ITEM);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(CheckoutPage);
    fixture.detectChanges();
    return fixture;
  }

  function fillContact(fixture: ReturnType<typeof TestBed.createComponent<CheckoutPage>>): void {
    const name: HTMLInputElement = fixture.nativeElement.querySelector('#customer-name');
    name.value = 'Ahmed Hassan';
    name.dispatchEvent(new Event('input'));
    const phone: HTMLInputElement = fixture.nativeElement.querySelector('#customer-phone');
    phone.value = '01012345678';
    phone.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }
});
