import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { LanguageService } from '../../core/i18n/language.service';
import { StaffSessionService } from '../kitchen/staff-session.service';
import { DriverApiService } from './driver-api.service';
import { DriverHubEvent, DriverHubService } from './driver-hub.service';
import { DriverPage } from './driver-page';
import { DriverOrderDto } from './driver.models';

const MOCK_READY_ORDER: DriverOrderDto = {
  id: 'ord-ready-1',
  publicCode: 'BH-101',
  createdAt: '2026-08-17T12:00:00Z',
  orderType: 'Delivery',
  status: 'Ready',
  customerName: 'محمود أحمد',
  customerPhone: '01011112222',
  deliveryAreaNameAr: 'مدينة نصر',
  deliveryAreaNameEn: 'Nasr City',
  address: 'شارع عباس العقاد عمارة 12 الدور 4',
  customerNote: 'يرجى عدم الاتصال بالهاتف قبل الوصول',
  subtotal: 300,
  deliveryFee: 30,
  total: 330,
  paymentMethod: 'Cash',
  paymentStatus: 'Pending',
  rowVersion: 'row-ready-v1',
  items: [
    {
      productNameAr: 'شاورما دجاج عائلي',
      productNameEn: 'Family Chicken Shawarma',
      quantity: 1,
    },
  ],
};

const MOCK_ONTHEWAY_ORDER: DriverOrderDto = {
  id: 'ord-transit-2',
  publicCode: 'BH-202',
  createdAt: '2026-08-17T12:05:00Z',
  orderType: 'Delivery',
  status: 'OnTheWay',
  customerName: 'سارة يوسف',
  customerPhone: '01033334444',
  deliveryAreaNameAr: 'المعادي',
  deliveryAreaNameEn: 'Maadi',
  address: 'شارع النصر برج الأمل',
  customerNote: null,
  subtotal: 180,
  deliveryFee: 20,
  total: 200,
  paymentMethod: 'CreditCard',
  paymentStatus: 'Paid',
  rowVersion: 'row-transit-v2',
  items: [
    {
      productNameAr: 'فتة شاورما لحم',
      productNameEn: 'Beef Shawarma Fatteh',
      quantity: 2,
    },
  ],
};

const MOCK_DELIVERED_ORDER: DriverOrderDto = {
  id: 'ord-done-3',
  publicCode: 'BH-303',
  createdAt: '2026-08-17T11:30:00Z',
  orderType: 'Delivery',
  status: 'Delivered',
  customerName: 'عمر خالد',
  customerPhone: '01055556666',
  deliveryAreaNameAr: 'الزمالك',
  deliveryAreaNameEn: 'Zamalek',
  address: 'شارع 26 يوليو',
  customerNote: null,
  subtotal: 450,
  deliveryFee: 25,
  total: 475,
  paymentMethod: 'Cash',
  paymentStatus: 'Paid',
  rowVersion: 'row-done-v3',
  items: [],
};

describe('DriverPage', () => {
  let fixture: ComponentFixture<DriverPage>;
  let apiSpy: {
    getAssignedOrders: ReturnType<typeof vi.fn>;
    startDelivery: ReturnType<typeof vi.fn>;
    markDelivered: ReturnType<typeof vi.fn>;
  };
  let hubMocks: {
    status: ReturnType<typeof vi.fn>;
    orderAssigned$: Subject<DriverOrderDto>;
    orderStatusChanged$: Subject<DriverHubEvent>;
    orderCompleted$: Subject<string>;
    reconnected$: Subject<void>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  };

  async function setup(
    initialOrders: readonly DriverOrderDto[] = [MOCK_READY_ORDER, MOCK_ONTHEWAY_ORDER],
  ) {
    apiSpy = {
      getAssignedOrders: vi.fn().mockReturnValue(of(initialOrders)),
      startDelivery: vi.fn().mockReturnValue(of('success')),
      markDelivered: vi.fn().mockReturnValue(of('success')),
    };

    hubMocks = {
      status: vi.fn().mockReturnValue('connected'),
      orderAssigned$: new Subject<DriverOrderDto>(),
      orderStatusChanged$: new Subject<DriverHubEvent>(),
      orderCompleted$: new Subject<string>(),
      reconnected$: new Subject<void>(),
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [DriverPage],
      providers: [
        provideRouter([]),
        {
          provide: StaffSessionService,
          useValue: {
            getSession: () => of({ isAuthenticated: true }),
            signOut: () => of(undefined),
          },
        },
        { provide: DriverApiService, useValue: apiSpy },
        { provide: DriverHubService, useValue: hubMocks },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverPage);
    fixture.detectChanges();
  }

  it('renders active delivery orders on initial load', async () => {
    await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('BH-101');
    expect(text).toContain('BH-202');
    expect(text).toContain('محمود أحمد');
    expect(text).toContain('سارة يوسف');
  });

  it('renders customer phone with a 1-tap tel: link call affordance', async () => {
    await setup([MOCK_READY_ORDER]);
    const callLink: HTMLAnchorElement | null = fixture.nativeElement.querySelector('a.call-btn');
    expect(callLink).toBeTruthy();
    expect(callLink?.getAttribute('href')).toBe('tel:01011112222');
    expect(callLink?.textContent).toContain('01011112222');
  });

  it('renders destination details including area, address and note', async () => {
    await setup([MOCK_READY_ORDER]);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('مدينة نصر');
    expect(text).toContain('شارع عباس العقاد عمارة 12 الدور 4');
    expect(text).toContain('يرجى عدم الاتصال بالهاتف قبل الوصول');
  });

  it('presents COD unmistakable collection amount for Cash Pending order', async () => {
    await setup([MOCK_READY_ORDER]);
    const paymentBlock = fixture.nativeElement.querySelector('.info-block--payment.payment--cod');
    expect(paymentBlock).toBeTruthy();
    expect(paymentBlock?.textContent).toContain('330');
    expect(paymentBlock?.textContent).toContain('المطلوب تحصيله');
  });

  it('presents Prepaid badge clearly when paymentStatus is Paid', async () => {
    await setup([MOCK_ONTHEWAY_ORDER]);
    const paymentBlock = fixture.nativeElement.querySelector(
      '.info-block--payment.payment--prepaid',
    );
    expect(paymentBlock).toBeTruthy();
    expect(paymentBlock?.textContent).toContain('مدفوع مسبقاً');
  });

  it('shows Start Delivery primary action for Ready order and transitions on confirmation', async () => {
    await setup([MOCK_READY_ORDER]);
    const startBtn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('.action-btn--start');
    expect(startBtn).toBeTruthy();
    expect(startBtn?.textContent).toContain('بدء التوصيل');

    // Click to open confirmation modal
    startBtn?.click();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.modal-card');
    expect(modal).toBeTruthy();
    expect(modal.textContent).toContain('تأكيد استلام الطلب');

    const confirmBtn: HTMLButtonElement | null = modal.querySelector('.modal-btn--confirm');
    expect(confirmBtn).toBeTruthy();
    confirmBtn?.click();
    fixture.detectChanges();

    expect(apiSpy.startDelivery).toHaveBeenCalledWith('ord-ready-1', 'row-ready-v1');
  });

  it('shows Mark Delivered primary action for OnTheWay order and confirms collection', async () => {
    const orderInTransit: DriverOrderDto = { ...MOCK_READY_ORDER, status: 'OnTheWay' };
    await setup([orderInTransit]);

    const deliverBtn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('.action-btn--deliver');
    expect(deliverBtn).toBeTruthy();
    expect(deliverBtn?.textContent).toContain('تم التسليم');

    deliverBtn?.click();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.modal-card');
    expect(modal).toBeTruthy();
    expect(modal.textContent).toContain('330'); // COD reminder in modal

    const confirmBtn: HTMLButtonElement | null = modal.querySelector('.modal-btn--confirm');
    confirmBtn?.click();
    fixture.detectChanges();

    expect(apiSpy.markDelivered).toHaveBeenCalledWith('ord-ready-1', 'row-ready-v1');
  });

  it('handles 409 concurrency conflict by showing warning banner and re-fetching', async () => {
    vi.useFakeTimers();
    await setup([MOCK_READY_ORDER]);
    apiSpy.startDelivery.mockReturnValue(of('stale'));

    const startBtn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('.action-btn--start');
    startBtn?.click();
    fixture.detectChanges();

    const confirmBtn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('.modal-btn--confirm');
    confirmBtn?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('تم تعديل بيانات هذا الطلب من عملية أخرى');

    // Fast forward timer for auto-reload
    vi.advanceTimersByTime(3000);
    expect(apiSpy.getAssignedOrders).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('renders completed orders in subordinate section without mutation action buttons', async () => {
    await setup([MOCK_READY_ORDER, MOCK_DELIVERED_ORDER]);
    const completedSection = fixture.nativeElement.querySelector('.delivery-section--completed');
    expect(completedSection).toBeTruthy();
    expect(completedSection.textContent).toContain('BH-303');
    expect(completedSection.textContent).toContain('عمر خالد');
    expect(completedSection.querySelector('.action-btn')).toBeFalsy();
  });

  it('allows toggling order items breakdown visibility', async () => {
    await setup([MOCK_READY_ORDER]);
    expect(fixture.nativeElement.querySelector('.items-list')).toBeFalsy();

    const toggleBtn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('.items-toggle-btn');
    toggleBtn?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.items-list')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('شاورما دجاج عائلي');

    toggleBtn?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.items-list')).toBeFalsy();
  });

  it('updates live state when SignalR events fire', async () => {
    await setup([MOCK_READY_ORDER]);
    expect(fixture.nativeElement.textContent).not.toContain('BH-NEW');

    const newOrder: DriverOrderDto = {
      ...MOCK_READY_ORDER,
      id: 'ord-new',
      publicCode: 'BH-NEW',
      customerName: 'جمال',
    };

    hubMocks.orderAssigned$.next(newOrder);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('BH-NEW');
    expect(fixture.nativeElement.textContent).toContain('جمال');
  });

  it('supports runtime language switching to English LTR and back to Arabic RTL', async () => {
    await setup([MOCK_READY_ORDER]);
    const langService = TestBed.inject(LanguageService);

    expect(fixture.nativeElement.querySelector('.driver-workspace')?.getAttribute('dir')).toBe(
      'rtl',
    );
    expect(fixture.nativeElement.textContent).toContain('الطلبات الجارية');

    const enButton: HTMLButtonElement | null =
      fixture.nativeElement.querySelectorAll('.lang-btn')[1];
    enButton?.click();
    fixture.detectChanges();

    expect(langService.current()).toBe('en');
    expect(fixture.nativeElement.querySelector('.driver-workspace')?.getAttribute('dir')).toBe(
      'ltr',
    );
    expect(fixture.nativeElement.textContent).toContain('Active Deliveries');
  });
});
