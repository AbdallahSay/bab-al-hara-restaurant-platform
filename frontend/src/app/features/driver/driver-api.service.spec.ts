import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { CustomerApiService } from '../customer-ordering/customer-api.service';
import { DriverApiService } from './driver-api.service';
import { DriverOrderDto } from './driver.models';

const SAMPLE_ORDER: DriverOrderDto = {
  publicCode: 'BH-101',
  createdAt: '2026-08-17T01:00:00Z',
  orderType: 'Delivery',
  status: 'Ready',
  customerName: 'Ahmed Aly',
  customerPhone: '01012345678',
  deliveryAreaNameAr: 'مدينة نصر',
  deliveryAreaNameEn: 'Nasr City',
  address: '15 Abbas El Akkad St',
  customerNote: 'Please ring bell',
  subtotal: 250,
  deliveryFee: 25,
  total: 275,
  paymentMethod: 'Cash',
  paymentStatus: 'Pending',
  rowVersion: 'AAAAAAAAB+E=',
  items: [{ productNameAr: 'مشاوي مشكل', productNameEn: 'Mixed Grill', quantity: 1 }],
};

describe('DriverApiService', () => {
  let service: DriverApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: APP_ENVIRONMENT,
          useValue: {
            production: false,
            apiBaseUrl: '/api',
            kitchenHubUrl: '/hubs/kitchen',
            driverHubUrl: '/hubs/driver',
          },
        },
        {
          provide: CustomerApiService,
          useValue: {
            antiforgeryToken: () => of('mock-xsrf-token'),
          },
        },
      ],
    });
    service = TestBed.inject(DriverApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('retrieves assigned driver orders with credentials', () => {
    let orders: DriverOrderDto[] = [];
    service.getAssignedOrders().subscribe((result) => (orders = result));

    const request = http.expectOne('/api/driver/orders/assigned');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush([SAMPLE_ORDER]);

    expect(orders.length).toBe(1);
    expect(orders[0]?.publicCode).toBe('BH-101');
  });

  it('posts start-delivery with antiforgery token and rowVersion', () => {
    let called = false;
    service.startDelivery('BH-101', 'AAAAAAAAB+E=').subscribe(() => (called = true));

    const request = http.expectOne('/api/orders/BH-101/start-delivery');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ rowVersion: 'AAAAAAAAB+E=' });
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('mock-xsrf-token');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ isSuccess: true });

    expect(called).toBe(true);
  });

  it('posts mark-delivered with antiforgery token and rowVersion', () => {
    let called = false;
    service.markDelivered('BH-101', 'AAAAAAAAB+E=').subscribe(() => (called = true));

    const request = http.expectOne('/api/orders/BH-101/mark-delivered');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ rowVersion: 'AAAAAAAAB+E=' });
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('mock-xsrf-token');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ isSuccess: true });

    expect(called).toBe(true);
  });
});
