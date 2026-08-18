import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import { HubConnectionState } from '@microsoft/signalr';

import { LanguageService } from '../../core/i18n/language.service';
import { CustomerOrderTracking, ReorderPreview } from './order-tracking.models';
import { CartService } from '../customer-ordering/cart/cart.service';
import { OrderTrackingPage } from './order-tracking-page';
import { TrackingApiService } from './tracking-api.service';
import { TrackingHubService } from './tracking-hub.service';

describe('OrderTrackingPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('bab-al-hara.language', 'ar');
  });

  afterEach(() => {
    localStorage.clear();
  });

  const mockDeliveryTracking: CustomerOrderTracking = {
    publicCode: 'BH-DELIV-99',
    status: 'Preparing',
    orderType: 'Delivery',
    createdAt: '2026-08-17T10:00:00Z',
    lastUpdatedAt: '2026-08-17T10:05:00Z',
    items: [
      {
        productNameAr: 'شاورما دجاج',
        productNameEn: 'Chicken Shawarma',
        quantity: 2,
        unitPrice: 50,
        lineTotal: 100,
      },
    ],
    subtotal: 100,
    deliveryFee: 20,
    total: 120,
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    deliveryAreaNameAr: 'المعادي',
    deliveryAreaNameEn: 'Maadi',
    address: 'شارع 9 المعادي',
    statusTimeline: [
      { status: 'Confirmed', changedAt: '2026-08-17T10:02:00Z' },
      { status: 'Preparing', changedAt: '2026-08-17T10:05:00Z' },
    ],
  };

  const mockDeliveredTracking: CustomerOrderTracking = {
    ...mockDeliveryTracking,
    publicCode: 'BH-DELIV-DONE',
    status: 'Delivered',
    statusTimeline: [
      { status: 'Confirmed', changedAt: '2026-08-17T10:02:00Z' },
      { status: 'Preparing', changedAt: '2026-08-17T10:05:00Z' },
      { status: 'OnTheWay', changedAt: '2026-08-17T10:15:00Z' },
      { status: 'Delivered', changedAt: '2026-08-17T10:30:00Z' },
    ],
  };

  const mockSuccessfulReorderPreview: ReorderPreview = {
    publicCode: 'BH-DELIV-DONE',
    orderType: 'Delivery',
    eligibleItems: [
      {
        menuItemId: 'item-1',
        nameAr: 'شاورما دجاج',
        nameEn: 'Chicken Shawarma',
        imageReference: '/images/shawarma.webp',
        quantity: 2,
        currentPrice: 55,
      },
    ],
    unavailableItems: [],
    suggestedDeliveryAreaId: 'area-1',
    suggestedDeliveryAreaNameAr: 'المعادي',
    suggestedDeliveryAreaNameEn: 'Maadi',
    suggestedAddress: 'شارع 9 المعادي',
    suggestedCustomerNote: null,
  };

  const mockPartialReorderPreview: ReorderPreview = {
    publicCode: 'BH-DELIV-DONE',
    orderType: 'Delivery',
    eligibleItems: [
      {
        menuItemId: 'item-1',
        nameAr: 'شاورما دجاج',
        nameEn: 'Chicken Shawarma',
        imageReference: '/images/shawarma.webp',
        quantity: 1,
        currentPrice: 55,
      },
    ],
    unavailableItems: [
      {
        menuItemId: 'item-2',
        historicalNameAr: 'سلطة سيزر',
        historicalNameEn: 'Caesar Salad',
        reason: 'SoldOut',
      },
    ],
    suggestedDeliveryAreaId: 'area-1',
    suggestedDeliveryAreaNameAr: 'المعادي',
    suggestedDeliveryAreaNameEn: 'Maadi',
    suggestedAddress: 'شارع 9 المعادي',
    suggestedCustomerNote: null,
  };

  const mockAllUnavailablePreview: ReorderPreview = {
    publicCode: 'BH-DELIV-DONE',
    orderType: 'Delivery',
    eligibleItems: [],
    unavailableItems: [
      {
        menuItemId: 'item-1',
        historicalNameAr: 'شاورما دجاج قديمة',
        historicalNameEn: 'Old Chicken Shawarma',
        reason: 'Inactive',
      },
    ],
    suggestedDeliveryAreaId: null,
    suggestedDeliveryAreaNameAr: null,
    suggestedDeliveryAreaNameEn: null,
    suggestedAddress: null,
    suggestedCustomerNote: null,
  };

  const mockTakeawayTracking: CustomerOrderTracking = {
    publicCode: 'BH-TAKE-88',
    status: 'Ready',
    orderType: 'Takeaway',
    createdAt: '2026-08-17T10:00:00Z',
    lastUpdatedAt: '2026-08-17T10:10:00Z',
    items: [
      {
        productNameAr: 'كباب حلبي',
        productNameEn: 'Halabi Kebab',
        quantity: 1,
        unitPrice: 90,
        lineTotal: 90,
      },
    ],
    subtotal: 90,
    deliveryFee: 0,
    total: 90,
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    deliveryAreaNameAr: null,
    deliveryAreaNameEn: null,
    address: null,
    statusTimeline: [
      { status: 'Confirmed', changedAt: '2026-08-17T10:02:00Z' },
      { status: 'Preparing', changedAt: '2026-08-17T10:05:00Z' },
      { status: 'Ready', changedAt: '2026-08-17T10:10:00Z' },
    ],
  };

  class MockTrackingApiService {
    getTrackingHandler: (code: string) => Observable<CustomerOrderTracking> = () =>
      of(mockDeliveryTracking);

    reorderPreviewHandler: (code: string) => Observable<ReorderPreview> = () =>
      of(mockSuccessfulReorderPreview);

    getTracking(code: string): Observable<CustomerOrderTracking> {
      return this.getTrackingHandler(code);
    }

    reorderPreview(code: string): Observable<ReorderPreview> {
      return this.reorderPreviewHandler(code);
    }
  }

  class MockTrackingHubService {
    readonly connectionState$ = new BehaviorSubject<HubConnectionState>(
      HubConnectionState.Connected,
    );
    readonly trackingUpdate$ = new Subject<CustomerOrderTracking>();
    readonly reconnected$ = new Subject<void>();

    startConnection(): Promise<void> {
      return Promise.resolve();
    }

    stopConnection(): Promise<void> {
      return Promise.resolve();
    }
  }

  async function createTestFixture(
    publicCode: string,
    apiService: MockTrackingApiService,
    hubService: MockTrackingHubService,
    language: 'ar' | 'en' = 'ar',
  ): Promise<ComponentFixture<OrderTrackingPage>> {
    localStorage.setItem('bab-al-hara.language', language);

    await TestBed.configureTestingModule({
      imports: [OrderTrackingPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { publicCode },
            },
          },
        },
        { provide: TrackingApiService, useValue: apiService },
      ],
    })
      .overrideComponent(OrderTrackingPage, {
        set: {
          providers: [{ provide: TrackingHubService, useValue: hubService }],
        },
      })
      .compileComponents();

    const langService = TestBed.inject(LanguageService);
    langService.setLanguage(language);

    return TestBed.createComponent(OrderTrackingPage);
  }

  it('loads and renders delivery tracking details automatically using cookie capability', async () => {
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    api.getTrackingHandler = () => of(mockDeliveryTracking);

    const fixture = await createTestFixture('BH-DELIV-99', api, hub, 'ar');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('BH-DELIV-99');
    expect(element.textContent).toContain('المطبخ بيجهز طلبك');

    // Stepper checks: Delivery has 6 steps including OnTheWay
    const steps = element.querySelectorAll('.stepper__step');
    expect(steps.length).toBe(6);
  });

  it('renders takeaway stepper without OnTheWay step', async () => {
    TestBed.resetTestingModule();
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    api.getTrackingHandler = () => of(mockTakeawayTracking);

    const fixture = await createTestFixture('BH-TAKE-88', api, hub, 'ar');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('BH-TAKE-88');
    expect(element.textContent).toContain('طلبك جاهز للاستلام');

    const steps = element.querySelectorAll('.stepper__step');
    expect(steps.length).toBe(5); // Pending, Confirmed, Preparing, Ready, Delivered (NO OnTheWay)
    expect(element.textContent).not.toContain('في الطريق');
  });

  it('shows error state when API fails or unauthorized', async () => {
    TestBed.resetTestingModule();
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    api.getTrackingHandler = () => throwError(() => new Error('401 Unauthorized'));

    const fixture = await createTestFixture('BH-DELIV-99', api, hub, 'ar');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('تعذر تحميل بيانات التتبع');
  });

  it('refetches tracking data on realtime reconnect', async () => {
    TestBed.resetTestingModule();
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    let callCount = 0;
    api.getTrackingHandler = () => {
      callCount++;
      return of(mockDeliveryTracking);
    };

    const fixture = await createTestFixture('BH-DELIV-99', api, hub, 'ar');
    fixture.detectChanges();
    await Promise.resolve();
    expect(callCount).toBe(1);

    hub.reconnected$.next();
    await Promise.resolve();
    expect(callCount).toBe(2);
  });

  it('updates tracking data dynamically when hub emits update', async () => {
    TestBed.resetTestingModule();
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    api.getTrackingHandler = () => of(mockDeliveryTracking);

    const fixture = await createTestFixture('BH-DELIV-99', api, hub, 'ar');
    fixture.detectChanges();
    await Promise.resolve();

    const updatedTracking: CustomerOrderTracking = {
      ...mockDeliveryTracking,
      status: 'OnTheWay',
      statusTimeline: [
        ...mockDeliveryTracking.statusTimeline,
        { status: 'OnTheWay', changedAt: '2026-08-17T10:15:00Z' },
      ],
    };

    hub.trackingUpdate$.next(updatedTracking);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('طلبك في الطريق');
  });

  it('renders English tracking details when English language is chosen', async () => {
    TestBed.resetTestingModule();
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    api.getTrackingHandler = () => of(mockDeliveryTracking);

    const fixture = await createTestFixture('BH-DELIV-99', api, hub, 'en');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('BH-DELIV-99');
    expect(element.textContent).toContain('The kitchen is preparing your order');
  });

  it('renders reorder CTA button only when order status is Delivered', async () => {
    TestBed.resetTestingModule();
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    // Non-delivered order
    api.getTrackingHandler = () => of(mockDeliveryTracking);

    const fixtureNotDelivered = await createTestFixture('BH-DELIV-99', api, hub, 'ar');
    fixtureNotDelivered.detectChanges();

    let element = fixtureNotDelivered.nativeElement as HTMLElement;
    expect(element.querySelector('.reorder-btn')).toBeNull();

    // Delivered order
    TestBed.resetTestingModule();
    api.getTrackingHandler = () => of(mockDeliveredTracking);
    const fixtureDelivered = await createTestFixture('BH-DELIV-DONE', api, hub, 'ar');
    fixtureDelivered.detectChanges();

    element = fixtureDelivered.nativeElement as HTMLElement;
    const reorderBtn = element.querySelector('.reorder-btn') as HTMLButtonElement | null;
    expect(reorderBtn).not.toBeNull();
    expect(reorderBtn?.textContent).toContain('اطلب نفس الطلب مرة أخرى');
  });

  it('adds eligible items directly into cart when cart is empty', async () => {
    TestBed.resetTestingModule();
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    api.getTrackingHandler = () => of(mockDeliveredTracking);
    api.reorderPreviewHandler = () => of(mockSuccessfulReorderPreview);

    const fixture = await createTestFixture('BH-DELIV-DONE', api, hub, 'ar');
    const cart = TestBed.inject(CartService);
    cart.clear();
    fixture.detectChanges();

    const reorderBtn = fixture.nativeElement.querySelector('.reorder-btn') as HTMLButtonElement;
    reorderBtn.click();
    fixture.detectChanges();

    expect(cart.items().length).toBe(1);
    expect(cart.items()[0]!.menuItemId).toBe('item-1');
    expect(cart.items()[0]!.quantity).toBe(2);
    expect(cart.items()[0]!.unitPrice).toBe(55);

    const feedback = fixture.nativeElement.querySelector('.reorder-feedback') as HTMLElement | null;
    expect(feedback).not.toBeNull();
    expect(feedback?.textContent).toContain('تمت إضافة أصناف الطلب إلى السلة بنجاح');
    expect(feedback?.querySelector('.view-cart-btn')).not.toBeNull();
  });

  it('opens confirmation modal when cart already has items and handles merge', async () => {
    TestBed.resetTestingModule();
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    api.getTrackingHandler = () => of(mockDeliveredTracking);
    api.reorderPreviewHandler = () => of(mockSuccessfulReorderPreview);

    const fixture = await createTestFixture('BH-DELIV-DONE', api, hub, 'ar');
    const cart = TestBed.inject(CartService);
    cart.clear();
    // Prepopulate cart
    cart.mergeItems([
      {
        menuItemId: 'item-1',
        nameAr: 'شاورما دجاج',
        nameEn: 'Chicken Shawarma',
        imageReference: '/images/shawarma.webp',
        unitPrice: 50,
        quantity: 98,
      },
      {
        menuItemId: 'item-existing',
        nameAr: 'مخلل',
        nameEn: 'Pickles',
        imageReference: '/images/pickles.webp',
        unitPrice: 10,
        quantity: 1,
      },
    ]);
    fixture.detectChanges();

    const reorderBtn = fixture.nativeElement.querySelector('.reorder-btn') as HTMLButtonElement;
    reorderBtn.click();
    fixture.detectChanges();

    // Modal should be open
    const modal = fixture.nativeElement.querySelector('.modal-overlay') as HTMLElement | null;
    expect(modal).not.toBeNull();
    expect(modal?.textContent).toContain('لديك أصناف بالفعل في السلة');

    // Click Merge button
    const buttons = modal?.querySelectorAll('button') ?? [];
    const mergeBtn = Array.from(buttons).find((b) => b.textContent?.includes('إضافة إلى السلة'));
    expect(mergeBtn).toBeDefined();
    mergeBtn?.click();
    fixture.detectChanges();

    // Modal should close
    expect(fixture.nativeElement.querySelector('.modal-overlay')).toBeNull();

    // Cart items merged: item-1 quantity was 98, adding 2 -> capped at 99
    expect(cart.items().length).toBe(2);
    const item1 = cart.items().find((i) => i.menuItemId === 'item-1');
    expect(item1?.quantity).toBe(99);
    expect(item1?.unitPrice).toBe(55); // Updated to latest current price
  });

  it('handles replace action when confirming reorder on existing cart', async () => {
    TestBed.resetTestingModule();
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    api.getTrackingHandler = () => of(mockDeliveredTracking);
    api.reorderPreviewHandler = () => of(mockSuccessfulReorderPreview);

    const fixture = await createTestFixture('BH-DELIV-DONE', api, hub, 'ar');
    const cart = TestBed.inject(CartService);
    cart.clear();
    cart.mergeItems([
      {
        menuItemId: 'old-item',
        nameAr: 'صنف قديم',
        nameEn: 'Old Item',
        imageReference: '/images/old.webp',
        unitPrice: 30,
        quantity: 5,
      },
    ]);
    fixture.detectChanges();

    const reorderBtn = fixture.nativeElement.querySelector('.reorder-btn') as HTMLButtonElement;
    reorderBtn.click();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('.modal-overlay') as HTMLElement;
    const replaceBtn = Array.from(modal.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('استبدال السلة'),
    );
    expect(replaceBtn).toBeDefined();
    replaceBtn?.click();
    fixture.detectChanges();

    // Cart replaced
    expect(cart.items().length).toBe(1);
    expect(cart.items()[0]!.menuItemId).toBe('item-1');
    expect(cart.items()[0]!.quantity).toBe(2);
  });

  it('communicates skipped / unavailable items when partial items are available', async () => {
    TestBed.resetTestingModule();
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    api.getTrackingHandler = () => of(mockDeliveredTracking);
    api.reorderPreviewHandler = () => of(mockPartialReorderPreview);

    const fixture = await createTestFixture('BH-DELIV-DONE', api, hub, 'ar');
    const cart = TestBed.inject(CartService);
    cart.clear();
    fixture.detectChanges();

    const reorderBtn = fixture.nativeElement.querySelector('.reorder-btn') as HTMLButtonElement;
    reorderBtn.click();
    fixture.detectChanges();

    expect(cart.items().length).toBe(1);
    const feedback = fixture.nativeElement.querySelector(
      '.reorder-feedback--partial',
    ) as HTMLElement;
    expect(feedback).not.toBeNull();
    expect(feedback.textContent).toContain('بعض أصناف طلبك السابق لم تعد متاحة');
    expect(feedback.textContent).toContain('سلطة سيزر');
    expect(feedback.textContent).toContain('غير متوفر حاليًا');
  });

  it('shows friendly unavailable dialog when all items from order are unavailable', async () => {
    TestBed.resetTestingModule();
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    api.getTrackingHandler = () => of(mockDeliveredTracking);
    api.reorderPreviewHandler = () => of(mockAllUnavailablePreview);

    const fixture = await createTestFixture('BH-DELIV-DONE', api, hub, 'ar');
    const cart = TestBed.inject(CartService);
    cart.clear();
    fixture.detectChanges();

    const reorderBtn = fixture.nativeElement.querySelector('.reorder-btn') as HTMLButtonElement;
    reorderBtn.click();
    fixture.detectChanges();

    expect(cart.items().length).toBe(0);
    const modal = fixture.nativeElement.querySelector('.modal-overlay') as HTMLElement;
    expect(modal).not.toBeNull();
    expect(modal.textContent).toContain('أصناف هذا الطلب لم تعد متاحة حاليًا');
    expect(modal.textContent).toContain('شاورما دجاج قديمة');
    expect(modal.textContent).toContain('غير متاح');
    expect(modal.querySelector('a[href="/"]')).not.toBeNull();
  });

  it('renders reorder CTA in English when English language is chosen', async () => {
    TestBed.resetTestingModule();
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    api.getTrackingHandler = () => of(mockDeliveredTracking);
    api.reorderPreviewHandler = () => of(mockSuccessfulReorderPreview);

    const fixture = await createTestFixture('BH-DELIV-DONE', api, hub, 'en');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const reorderBtn = element.querySelector('.reorder-btn') as HTMLButtonElement;
    expect(reorderBtn).not.toBeNull();
    expect(reorderBtn.textContent).toContain('Order again');
  });
});
