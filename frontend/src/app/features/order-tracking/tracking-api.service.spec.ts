import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { CustomerOrderTracking, ReorderPreview } from './order-tracking.models';
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

  it('performs tracking GET with withCredentials and without manual secret header', () => {
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
    service.getTracking('BH-TRACK-1').subscribe((data) => {
      result = data;
    });

    const req = httpTesting.expectOne('/api/orders/track/BH-TRACK-1');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.headers.has('X-Tracking-Token')).toBe(false);

    req.flush(mockTracking);
    expect(result).toEqual(mockTracking);
  });

  it('performs reorder-preview POST with withCredentials', () => {
    const mockPreview: ReorderPreview = {
      publicCode: 'BH-TRACK-1',
      orderType: 'Delivery',
      eligibleItems: [
        {
          menuItemId: 'item-1',
          nameAr: 'شاورما',
          nameEn: 'Shawarma',
          imageReference: '/images/shawarma.webp',
          quantity: 2,
          currentPrice: 50,
        },
      ],
      unavailableItems: [
        {
          menuItemId: 'item-2',
          historicalNameAr: 'سلطة قديمة',
          historicalNameEn: 'Old Salad',
          reason: 'SoldOut',
        },
      ],
      suggestedDeliveryAreaId: 'area-1',
      suggestedDeliveryAreaNameAr: 'المعادي',
      suggestedDeliveryAreaNameEn: 'Maadi',
      suggestedAddress: '123 Nile St',
      suggestedCustomerNote: 'Extra garlic',
    };

    let result: ReorderPreview | undefined;
    service.reorderPreview('BH-TRACK-1').subscribe((data) => {
      result = data;
    });

    const req = httpTesting.expectOne('/api/orders/track/BH-TRACK-1/reorder-preview');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);

    req.flush(mockPreview);
    expect(result).toEqual(mockPreview);
  });
});
