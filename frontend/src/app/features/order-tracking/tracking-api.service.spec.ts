import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CustomerOrderTracking } from './order-tracking.models';
import { TrackingApiService } from './tracking-api.service';

describe('TrackingApiService', () => {
  let service: TrackingApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TrackingApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('sends X-Tracking-Token header and returns tracking data', () => {
    const mockTracking: CustomerOrderTracking = {
      publicCode: 'BH-TRACK-1',
      status: 'Preparing',
      orderType: 'Delivery',
      createdAt: '2026-08-17T10:00:00Z',
      lastUpdatedAt: '2026-08-17T10:05:00Z',
      items: [
        {
          productNameAr: 'شاورما',
          productNameEn: 'Shawarma',
          quantity: 2,
          unitPrice: 45,
          lineTotal: 90,
        },
      ],
      subtotal: 90,
      deliveryFee: 15,
      total: 105,
      paymentMethod: 'Cash',
      paymentStatus: 'Pending',
      deliveryAreaNameAr: 'المعادي',
      deliveryAreaNameEn: 'Maadi',
      address: '123 Nile St',
      statusTimeline: [
        { status: 'Confirmed', changedAt: '2026-08-17T10:02:00Z' },
        { status: 'Preparing', changedAt: '2026-08-17T10:05:00Z' },
      ],
    };

    let result: CustomerOrderTracking | undefined;
    service.getTracking('BH-TRACK-1', 'raw-token-123').subscribe((data) => {
      result = data;
    });

    const req = httpTesting.expectOne('/api/orders/track/BH-TRACK-1');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('X-Tracking-Token')).toBe('raw-token-123');

    req.flush(mockTracking);
    expect(result).toEqual(mockTracking);
  });
});
