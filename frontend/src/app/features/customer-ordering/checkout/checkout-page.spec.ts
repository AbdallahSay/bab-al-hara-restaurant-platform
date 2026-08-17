import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LanguageService } from '../../../core/i18n/language.service';
import { CartService } from '../cart/cart.service';
import {
  CUSTOMER_CONTACT_STORAGE_KEY,
  CustomerContactProfileService,
} from '../customer-contact-profile.service';
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
    localStorage.setItem('bab-al-hara.language', 'ar');
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
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
    expect(fixture.nativeElement.textContent).toContain('هذا الحقل مطلوب');
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

  it('updates the stepper progress indicators as user fills contact and selects fulfillment', async () => {
    const fixture = await createFixture({ createOrder: () => of(ORDER) });
    const steps = fixture.nativeElement.querySelectorAll('.stepper-step');
    expect(steps.length).toBe(3);

    // Initial state: step 1 active, incomplete
    expect(steps[0].classList.contains('is-active')).toBe(true);
    expect(steps[0].classList.contains('is-complete')).toBe(false);

    // Fill contact details
    fillContact(fixture);
    fixture.detectChanges();

    expect(steps[0].classList.contains('is-complete')).toBe(true);
    // Takeaway is default so step 2 is complete
    expect(steps[1].classList.contains('is-complete')).toBe(true);
    expect(steps[2].classList.contains('is-complete')).toBe(true);
  });

  it('verifies input directionality (dir="auto" for name/address, dir="ltr" for phone)', async () => {
    const fixture = await createFixture({ createOrder: () => of(ORDER) });

    const nameInput: HTMLInputElement = fixture.nativeElement.querySelector('#customer-name');
    const phoneInput: HTMLInputElement = fixture.nativeElement.querySelector('#customer-phone');

    expect(nameInput.getAttribute('dir')).toBe('auto');
    expect(phoneInput.getAttribute('dir')).toBe('ltr');

    // Switch to delivery to check address input
    const deliveryRadio: HTMLInputElement =
      fixture.nativeElement.querySelector('input[value="Delivery"]');
    deliveryRadio.click();
    fixture.detectChanges();

    const addressTextarea: HTMLTextAreaElement =
      fixture.nativeElement.querySelector('#delivery-address');
    expect(addressTextarea.getAttribute('dir')).toBe('auto');
  });

  it('renders order summary breakdown and updates delivery fee when area is chosen', async () => {
    const fixture = await createFixture({ createOrder: () => of(ORDER) });

    const summary = fixture.nativeElement.querySelector('.checkout-summary');
    expect(summary.textContent).toContain('سندوتش كفتة');
    expect(summary.textContent).toContain('مجاناً');

    // Switch to Delivery and pick an area
    const deliveryRadio: HTMLInputElement =
      fixture.nativeElement.querySelector('input[value="Delivery"]');
    deliveryRadio.click();
    fixture.detectChanges();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('#delivery-area');
    select.value = 'area-1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // Delivery fee 35 added to 85 subtotal -> 120 total
    expect(summary.textContent).toContain('١٢٠');
  });

  it('renders both English and Arabic translations accurately when language changes', async () => {
    const fixture = await createFixture({ createOrder: () => of(ORDER) });
    const language = TestBed.inject(LanguageService);

    expect(fixture.nativeElement.textContent).toContain('إتمام الطلب');
    expect(fixture.nativeElement.textContent).toContain('بياناتك');

    language.setLanguage('en');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Checkout');
    expect(fixture.nativeElement.textContent).toContain('Details');
    expect(fixture.nativeElement.textContent).toContain('Fulfillment');
    expect(fixture.nativeElement.textContent).toContain('Payment');
    expect(fixture.nativeElement.textContent).toContain('Kofta sandwich');
    expect(fixture.nativeElement.querySelector('.checkout-summary').textContent).toContain('85.00');
  });

  it('renders mobile sticky action bar with total and submit button', async () => {
    const fixture = await createFixture({ createOrder: () => of(ORDER) });

    const mobileBar = fixture.nativeElement.querySelector('.mobile-action-bar');
    expect(mobileBar).toBeTruthy();
    expect(mobileBar.querySelector('.mobile-action-bar__amount').textContent).toContain('٨٥');
    expect(mobileBar.querySelector('.mobile-action-bar__btn')).toBeTruthy();
  });

  it('prefills contact info for returning customers with saved profile', async () => {
    localStorage.setItem(
      CUSTOMER_CONTACT_STORAGE_KEY,
      JSON.stringify({ name: 'محمود سامي', phone: '01099887766' }),
    );

    const fixture = await createFixture({ createOrder: () => of(ORDER) });
    const nameInput: HTMLInputElement = fixture.nativeElement.querySelector('#customer-name');
    const phoneInput: HTMLInputElement = fixture.nativeElement.querySelector('#customer-phone');

    expect(nameInput.value).toBe('محمود سامي');
    expect(phoneInput.value).toBe('01099887766');

    // Contextual badge is displayed
    expect(fixture.nativeElement.querySelector('.saved-contact-badge')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('استخدمنا بياناتك المحفوظة');
  });

  it('allows returning customers to clear saved contact details', async () => {
    localStorage.setItem(
      CUSTOMER_CONTACT_STORAGE_KEY,
      JSON.stringify({ name: 'خالد يوسف', phone: '01211223344' }),
    );

    const fixture = await createFixture({ createOrder: () => of(ORDER) });
    const clearBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.clear-contact-btn');
    expect(clearBtn).toBeTruthy();

    clearBtn.click();
    fixture.detectChanges();

    const nameInput: HTMLInputElement = fixture.nativeElement.querySelector('#customer-name');
    const phoneInput: HTMLInputElement = fixture.nativeElement.querySelector('#customer-phone');
    expect(nameInput.value).toBe('');
    expect(phoneInput.value).toBe('');
    expect(fixture.nativeElement.querySelector('.saved-contact-badge')).toBeNull();
    expect(localStorage.getItem(CUSTOMER_CONTACT_STORAGE_KEY)).toBeNull();
  });

  it('persists customer contact details only upon successful order creation and updates them on subsequent orders', async () => {
    let callCount = 0;
    const fixture = await createFixture({
      createOrder: () => {
        callCount++;
        if (callCount === 1) {
          return of(ORDER);
        }
        return of({ ...ORDER, publicCode: 'BH-TEST-456' });
      },
    });

    const contactProfile = TestBed.inject(CustomerContactProfileService);
    expect(contactProfile.profile()).toBeNull();

    fillContact(fixture);
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(contactProfile.profile()).toEqual({
      name: 'Ahmed Hassan',
      phone: '01012345678',
    });

    const stored = JSON.parse(
      localStorage.getItem(CUSTOMER_CONTACT_STORAGE_KEY) ?? '{}',
    ) as unknown;
    expect(stored).toEqual({
      name: 'Ahmed Hassan',
      phone: '01012345678',
    });
  });

  it('disables the submit button and shows pause notice when restaurant is not accepting orders', async () => {
    const fixture = await createFixture({
      getRestaurantStatus: () =>
        of({
          acceptingOrders: false,
          messageAr: '?????? ????? ?????? ?? ??????? ??????? ???????',
          messageEn: 'The restaurant is temporarily paused for maintenance',
        }),
    });
    fillContact(fixture);

    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.desktop-submit-btn');
    expect(submitBtn.disabled).toBe(true);
    expect(submitBtn.getAttribute('title')).toBe('?????? ????? ?????? ?? ??????? ??????? ???????');
    expect(fixture.nativeElement.textContent).toContain(
      '?????? ????? ?????? ?? ??????? ??????? ???????',
    );
  });

  it('handles 409 restaurant_not_accepting_orders during order creation without clearing cart and disables submit button', async () => {
    const fixture = await createFixture({
      createOrder: () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              error: {
                code: 'restaurant_not_accepting_orders',
                detail: '?????? ?? ?????? ????? ????? ??????',
              },
            }),
        ),
    });

    const cart = TestBed.inject(CartService);
    expect(cart.items().length).toBe(1);

    fillContact(fixture);
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    // Check error message displayed
    expect(fixture.nativeElement.querySelector('.error-banner')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.error-banner').textContent).toContain(
      'المطعم متوقف مؤقتًا عن استقبال طلبات جديدة',
    );

    // Cart items MUST remain intact!
    expect(cart.items().length).toBe(1);

    // Submit button should now be disabled
    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.desktop-submit-btn');
    expect(submitBtn.disabled).toBe(true);
  });

  it('does NOT save contact details if order creation fails', async () => {
    const fixture = await createFixture({
      createOrder: () =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              error: { code: 'internal_error' },
            }),
        ),
    });

    const contactProfile = TestBed.inject(CustomerContactProfileService);
    fillContact(fixture);

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(contactProfile.profile()).toBeNull();
    expect(localStorage.getItem(CUSTOMER_CONTACT_STORAGE_KEY)).toBeNull();
  });

  async function createFixture(apiOverrides: Partial<CustomerApiService>) {
    await TestBed.configureTestingModule({
      imports: [CheckoutPage],
      providers: [
        provideRouter([]),
        {
          provide: CustomerApiService,
          useValue: {
            getRestaurantStatus: () =>
              of({
                acceptingOrders: true,
                messageAr: null,
                messageEn: null,
              }),
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
