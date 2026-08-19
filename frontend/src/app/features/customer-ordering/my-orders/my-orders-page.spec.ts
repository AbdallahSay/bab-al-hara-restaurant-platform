import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LanguageService } from '../../../core/i18n/language.service';
import { CartService } from '../cart/cart.service';
import { RecentOrdersService } from '../recent-orders.service';
import { CustomerOrderTracking, ReorderPreview } from '../../order-tracking/order-tracking.models';
import { TrackingApiService } from '../../order-tracking/tracking-api.service';
import { MyOrdersPage } from './my-orders-page';

describe('MyOrdersPage', () => {
  let fixture: ComponentFixture<MyOrdersPage>;
  let component: MyOrdersPage;
  let recentOrdersService: RecentOrdersService;
  let trackingApiService: TrackingApiService;
  let cartService: CartService;
  let languageService: LanguageService;

  const mockActiveOrder: CustomerOrderTracking = {
    publicCode: 'ORD-ACTIVE',
    orderType: 'Delivery',
    status: 'Preparing',
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    total: 350,
    subtotal: 300,
    deliveryFee: 50,
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    items: [
      {
        productNameAr: 'شاورما دجاج',
        productNameEn: 'Chicken Shawarma',
        quantity: 2,
        unitPrice: 150,
        lineTotal: 300,
      },
    ],
    statusTimeline: [{ status: 'Preparing', changedAt: new Date().toISOString() }],
    address: '123 Cairo St',
    deliveryAreaNameAr: 'الدقي',
    deliveryAreaNameEn: 'Dokki',
  };

  const mockDeliveredOrder: CustomerOrderTracking = {
    publicCode: 'ORD-DELIVERED',
    orderType: 'Takeaway',
    status: 'Delivered',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 86400000).toISOString(),
    total: 200,
    subtotal: 200,
    deliveryFee: 0,
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    items: [
      {
        productNameAr: 'كباب مشوي',
        productNameEn: 'Grilled Kebab',
        quantity: 1,
        unitPrice: 200,
        lineTotal: 200,
      },
    ],
    statusTimeline: [{ status: 'Delivered', changedAt: new Date().toISOString() }],
    address: null,
    deliveryAreaNameAr: null,
    deliveryAreaNameEn: null,
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [MyOrdersPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    recentOrdersService = TestBed.inject(RecentOrdersService);
    trackingApiService = TestBed.inject(TrackingApiService);
    cartService = TestBed.inject(CartService);
    languageService = TestBed.inject(LanguageService);
    languageService.setLanguage('ar');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders empty state when no recent orders exist', () => {
    fixture = TestBed.createComponent(MyOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-state')).toBeTruthy();
    expect(compiled.textContent).toContain('لا توجد طلبات محفوظة');
    expect(compiled.textContent).toContain(
      'تظهر هنا الطلبات التي أنشأتها أو تابعتها على هذا الجهاز.',
    );
  });

  it('loads and groups orders into Active and Previous sections', () => {
    recentOrdersService.registerOrder('ORD-ACTIVE');
    recentOrdersService.registerOrder('ORD-DELIVERED');

    vi.spyOn(trackingApiService, 'getTracking').mockImplementation((code) => {
      if (code === 'ORD-ACTIVE') return of(mockActiveOrder);
      if (code === 'ORD-DELIVERED') return of(mockDeliveredOrder);
      return throwError(() => new Error('Not found'));
    });

    fixture = TestBed.createComponent(MyOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const activeSection = compiled.querySelector('.active-section');
    const prevSection = compiled.querySelector('.previous-section');

    expect(activeSection).toBeTruthy();
    expect(activeSection?.textContent).toContain('ORD-ACTIVE');
    expect(activeSection?.textContent).toContain('متابعة الطلب');

    expect(prevSection).toBeTruthy();
    expect(prevSection?.textContent).toContain('ORD-DELIVERED');
    expect(prevSection?.textContent).toContain('عرض التفاصيل');
    expect(prevSection?.textContent).toContain('اطلب مرة أخرى');
  });

  it('sets activeOrderCode in RecentOrdersService when active order exists', () => {
    recentOrdersService.registerOrder('ORD-ACTIVE');

    vi.spyOn(trackingApiService, 'getTracking').mockReturnValue(of(mockActiveOrder));

    fixture = TestBed.createComponent(MyOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(recentOrdersService.activeOrderCode()).toBe('ORD-ACTIVE');
  });

  it('handles inaccessible/expired orders safely without exposing sensitive data', () => {
    recentOrdersService.registerOrder('ORD-EXPIRED');

    vi.spyOn(trackingApiService, 'getTracking').mockReturnValue(
      throwError(() => ({ status: 401, error: 'Unauthorized' })),
    );

    fixture = TestBed.createComponent(MyOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.active-section')).toBeFalsy();
    expect(compiled.querySelector('.previous-section')).toBeFalsy();

    const inaccSection = compiled.querySelector('.inaccessible-section');
    expect(inaccSection).toBeTruthy();
    expect(inaccSection?.textContent).toContain('ORD-EXPIRED');
    expect(inaccSection?.textContent).toContain('إزالة من القائمة');

    // Click remove
    const removeBtn = inaccSection?.querySelector('.btn-remove-inaccessible') as HTMLButtonElement;
    removeBtn.click();
    fixture.detectChanges();

    expect(recentOrdersService.orders()).toEqual([]);
  });

  it('executes reorder on empty cart directly with feedback toast', () => {
    recentOrdersService.registerOrder('ORD-DELIVERED');
    vi.spyOn(trackingApiService, 'getTracking').mockReturnValue(of(mockDeliveredOrder));

    const mockPreview: ReorderPreview = {
      publicCode: 'ORD-DELIVERED',
      orderType: 'Takeaway',
      eligibleItems: [
        {
          menuItemId: 'menu-2',
          nameAr: 'كباب مشوي',
          nameEn: 'Grilled Kebab',
          imageReference: '/img/kebab.webp',
          quantity: 1,
          currentPrice: 210,
        },
      ],
      unavailableItems: [],
      suggestedDeliveryAreaId: null,
      suggestedDeliveryAreaNameAr: null,
      suggestedDeliveryAreaNameEn: null,
      suggestedAddress: null,
      suggestedCustomerNote: null,
    };

    vi.spyOn(trackingApiService, 'reorderPreview').mockReturnValue(of(mockPreview));

    fixture = TestBed.createComponent(MyOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const reorderBtn = compiled.querySelector('.btn-reorder-primary') as HTMLButtonElement;
    expect(reorderBtn).toBeTruthy();

    reorderBtn.click();
    fixture.detectChanges();

    expect(cartService.items().length).toBe(1);
    expect(cartService.items()[0]!.menuItemId).toBe('menu-2');
    expect(cartService.items()[0]!.unitPrice).toBe(210);

    const feedback = compiled.querySelector('.reorder-feedback');
    expect(feedback).toBeTruthy();
    expect(feedback?.textContent).toContain('تمت إضافة أصناف الطلب إلى السلة بنجاح');
  });

  it('opens merge dialog when cart already has items and applies chosen strategy', () => {
    recentOrdersService.registerOrder('ORD-DELIVERED');
    vi.spyOn(trackingApiService, 'getTracking').mockReturnValue(of(mockDeliveredOrder));

    // Cart already has 1 item
    cartService.mergeItems([
      {
        menuItemId: 'existing-item',
        nameAr: 'حواوشي',
        nameEn: 'Hawawshi',
        imageReference: '/img/hawawshi.webp',
        unitPrice: 100,
        quantity: 1,
      },
    ]);

    const mockPreview: ReorderPreview = {
      publicCode: 'ORD-DELIVERED',
      orderType: 'Takeaway',
      eligibleItems: [
        {
          menuItemId: 'menu-2',
          nameAr: 'كباب مشوي',
          nameEn: 'Grilled Kebab',
          imageReference: '/img/kebab.webp',
          quantity: 2,
          currentPrice: 200,
        },
      ],
      unavailableItems: [],
      suggestedDeliveryAreaId: null,
      suggestedDeliveryAreaNameAr: null,
      suggestedDeliveryAreaNameEn: null,
      suggestedAddress: null,
      suggestedCustomerNote: null,
    };

    vi.spyOn(trackingApiService, 'reorderPreview').mockReturnValue(of(mockPreview));

    fixture = TestBed.createComponent(MyOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const reorderBtn = compiled.querySelector('.btn-reorder-primary') as HTMLButtonElement;
    reorderBtn.click();
    fixture.detectChanges();

    // Dialog is visible
    expect(compiled.querySelector('.reorder-modal')).toBeTruthy();
    expect(compiled.textContent).toContain('لديك أصناف بالفعل في السلة');

    // Click Merge
    const mergeBtn = compiled.querySelector('.btn-merge') as HTMLButtonElement;
    mergeBtn.click();
    fixture.detectChanges();

    expect(cartService.items().length).toBe(2);
    expect(compiled.querySelector('.reorder-modal')).toBeFalsy();
  });

  it('shows all unavailable dialog when reorder preview has 0 eligible items', () => {
    recentOrdersService.registerOrder('ORD-DELIVERED');
    vi.spyOn(trackingApiService, 'getTracking').mockReturnValue(of(mockDeliveredOrder));

    const mockPreview: ReorderPreview = {
      publicCode: 'ORD-DELIVERED',
      orderType: 'Takeaway',
      eligibleItems: [],
      unavailableItems: [
        {
          menuItemId: 'menu-2',
          historicalNameAr: 'كباب قديم',
          historicalNameEn: 'Old Kebab',
          reason: 'SoldOut',
        },
      ],
      suggestedDeliveryAreaId: null,
      suggestedDeliveryAreaNameAr: null,
      suggestedDeliveryAreaNameEn: null,
      suggestedAddress: null,
      suggestedCustomerNote: null,
    };

    vi.spyOn(trackingApiService, 'reorderPreview').mockReturnValue(of(mockPreview));

    fixture = TestBed.createComponent(MyOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const reorderBtn = compiled.querySelector('.btn-reorder-primary') as HTMLButtonElement;
    reorderBtn.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.reorder-modal')).toBeTruthy();
    expect(compiled.textContent).toContain('أصناف هذا الطلب لم تعد متاحة حاليًا');
    expect(cartService.items().length).toBe(0);
  });

  it('supports English language view correctly', () => {
    languageService.setLanguage('en');
    recentOrdersService.registerOrder('ORD-ACTIVE');

    vi.spyOn(trackingApiService, 'getTracking').mockReturnValue(of(mockActiveOrder));

    fixture = TestBed.createComponent(MyOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('My Orders');
    expect(compiled.textContent).toContain('Orders created or tracked on this device appear here.');
    expect(compiled.textContent).toContain('Active Orders');
    expect(compiled.textContent).toContain('Track Order');
  });
});
