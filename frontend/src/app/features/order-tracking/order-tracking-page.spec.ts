import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';
import { HubConnectionState } from '@microsoft/signalr';

import { CustomerOrderTracking } from './order-tracking.models';
import { OrderTrackingPage } from './order-tracking-page';
import { TrackingApiService } from './tracking-api.service';
import { TrackingCredentialService } from './tracking-credential.service';
import { TrackingHubService } from './tracking-hub.service';

describe('OrderTrackingPage', () => {
  let credentialService: TrackingCredentialService;

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
    getTrackingHandler: (code: string, token: string) => Observable<CustomerOrderTracking> =
      () => of(mockDeliveryTracking);

    getTracking(code: string, token: string): Observable<CustomerOrderTracking> {
      return this.getTrackingHandler(code, token);
    }
  }

  class MockTrackingHubService {
    readonly connectionState$ = new BehaviorSubject<HubConnectionState>(HubConnectionState.Connected);
    readonly trackingUpdate$ = new Subject<CustomerOrderTracking>();
    readonly reconnected$ = new Subject<void>();

    startConnection(): Promise<void> {
      return Promise.resolve();
    }

    stopConnection(): Promise<void> {
      return Promise.resolve();
    }
  }

  afterEach(() => {
    sessionStorage.clear();
  });

  async function createTestFixture(
    publicCode: string,
    apiService: MockTrackingApiService,
    hubService: MockTrackingHubService,
  ): Promise<ComponentFixture<OrderTrackingPage>> {
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
        { provide: TrackingHubService, useValue: hubService },
      ],
    }).compileComponents();

    credentialService = TestBed.inject(TrackingCredentialService);
    return TestBed.createComponent(OrderTrackingPage);
  }

  it('shows no-credential state when token is not in sessionStorage', async () => {
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    let apiCalled = false;
    api.getTrackingHandler = () => {
      apiCalled = true;
      return of(mockDeliveryTracking);
    };

    const fixture = await createTestFixture('BH-DELIV-99', api, hub);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('التتبع متاح فقط من الجهاز');
    expect(apiCalled).toBe(false);
  });

  it('loads and renders delivery tracking details when credential exists', async () => {
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    api.getTrackingHandler = () => of(mockDeliveryTracking);

    const fixture = await createTestFixture('BH-DELIV-99', api, hub);
    credentialService.store('BH-DELIV-99', 'valid-token-abc');

    // Re-init with credential present
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('BH-DELIV-99');
    expect(element.textContent).toContain('المطبخ بيجهز طلبك');

    // Stepper checks: Delivery has OnTheWay step
    const steps = element.querySelectorAll('.stepper__step');
    expect(steps.length).toBe(6); // Pending, Confirmed, Preparing, Ready, OnTheWay, Delivered

    // Token security: raw token must NOT be in DOM
    expect(element.innerHTML).not.toContain('valid-token-abc');
  });

  it('renders takeaway stepper without OnTheWay step', async () => {
    TestBed.resetTestingModule();
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    api.getTrackingHandler = () => of(mockTakeawayTracking);

    const fixture = await createTestFixture('BH-TAKE-88', api, hub);
    credentialService.store('BH-TAKE-88', 'valid-takeaway-token');

    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('BH-TAKE-88');
    expect(element.textContent).toContain('طلبك جاهز للاستلام');

    const steps = element.querySelectorAll('.stepper__step');
    expect(steps.length).toBe(5); // Pending, Confirmed, Preparing, Ready, Delivered (NO OnTheWay)
    expect(element.textContent).not.toContain('في الطريق');
  });

  it('shows error state when API fails', async () => {
    TestBed.resetTestingModule();
    const api = new MockTrackingApiService();
    const hub = new MockTrackingHubService();
    api.getTrackingHandler = () => throwError(() => new Error('Network error'));

    const fixture = await createTestFixture('BH-DELIV-99', api, hub);
    credentialService.store('BH-DELIV-99', 'valid-token-abc');

    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('تعذر تحميل بيانات التتبع');
  });
});
