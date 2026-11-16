import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { CustomerOrderTracking } from '../../order-tracking/order-tracking.models';
import { TrackingApiService } from '../../order-tracking/tracking-api.service';
import { OrderDetailsPage } from './order-details-page';

const dummyOrder: CustomerOrderTracking = {
  publicCode: 'BH-TEST99',
  status: 'Preparing',
  orderType: 'Delivery',
  subtotal: 295,
  deliveryFee: 25,
  total: 320,
  paymentMethod: 'Cash',
  paymentStatus: 'Pending',
  createdAt: new Date().toISOString(),
  lastUpdatedAt: new Date().toISOString(),
  deliveryAreaNameAr: 'وسط البلد',
  deliveryAreaNameEn: 'Downtown',
  address: 'شارع الجمهورية - عمارة 15',
  statusTimeline: [],
  items: [
    {
      productNameAr: 'مشكل مشاوي',
      productNameEn: 'Mixed Grill',
      quantity: 1,
      unitPrice: 295,
      lineTotal: 295,
    },
  ],
};

describe('OrderDetailsPage', () => {
  it('renders order receipt details when publicCode is resolved', async () => {
    const apiMock = {
      getTracking: () => of(dummyOrder),
      reorderPreview: () => of({ eligibleItems: [], unavailableItems: [] }),
    };

    const routeMock = {
      paramMap: of(convertToParamMap({ publicCode: 'BH-TEST99' })),
    };

    await TestBed.configureTestingModule({
      imports: [OrderDetailsPage],
      providers: [
        provideRouter([]),
        { provide: TrackingApiService, useValue: apiMock },
        { provide: ActivatedRoute, useValue: routeMock },
      ],
    }).compileComponents();

    const fixture: ComponentFixture<OrderDetailsPage> =
      TestBed.createComponent(OrderDetailsPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.order-code')?.textContent).toContain('BH-TEST99');
    expect(compiled.querySelector('.status-badge')?.textContent).toContain('المطبخ بيجهز طلبك');
    expect(compiled.querySelectorAll('.item-row').length).toBe(1);
    expect(compiled.querySelector('.address-text')?.textContent).toContain('شارع الجمهورية');
  });
});
