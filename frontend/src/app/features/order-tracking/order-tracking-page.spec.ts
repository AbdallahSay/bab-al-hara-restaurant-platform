import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import { HubConnectionState } from '@microsoft/signalr';

import { LanguageService } from '../../core/i18n/language.service';
import { CustomerOrderTracking } from './order-tracking.models';
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

    getTracking(code: string): Observable<CustomerOrderTracking> {
      return this.getTrackingHandler(code);
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
});
