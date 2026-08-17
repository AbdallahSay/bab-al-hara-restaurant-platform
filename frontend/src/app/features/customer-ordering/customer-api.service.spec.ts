import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { CustomerApiService } from './customer-api.service';
import { RestaurantPublicStatusResponse } from './order.models';

describe('CustomerApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: APP_ENVIRONMENT,
          useValue: { production: false, apiBaseUrl: '/api', kitchenHubUrl: '/hubs/kitchen' },
        },
      ],
    });
  });

  it('fetches restaurant public status', () => {
    const service = TestBed.inject(CustomerApiService);
    const http = TestBed.inject(HttpTestingController);
    let statusResponse: RestaurantPublicStatusResponse | null = null;

    service.getRestaurantStatus().subscribe((res) => (statusResponse = res));

    const request = http.expectOne('/api/restaurant/status');
    expect(request.request.method).toBe('GET');
    request.flush({
      acceptingOrders: false,
      messageAr: '?????? ?????? ???? ???????',
      messageEn: 'Sorry, the restaurant is closed for maintenance',
    });

    expect(statusResponse).toEqual({
      acceptingOrders: false,
      messageAr: '?????? ?????? ???? ???????',
      messageEn: 'Sorry, the restaurant is closed for maintenance',
    });
    http.verify();
  });

  it('posts only the explicit order contract with an antiforgery token', () => {
    const service = TestBed.inject(CustomerApiService);
    const http = TestBed.inject(HttpTestingController);
    let publicCode = '';

    service
      .createOrder({
        customerName: 'Ahmed',
        customerPhone: '01012345678',
        orderType: 'Takeaway',
        deliveryAreaId: null,
        address: null,
        customerNote: null,
        items: [{ menuItemId: 'item-1', quantity: 2 }],
      })
      .subscribe((order) => (publicCode = order.publicCode));

    http.expectOne('/api/security/csrf').flush({ requestToken: 'csrf-token' });
    const request = http.expectOne('/api/orders');
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-token');
    expect(request.request.body).not.toHaveProperty('total');
    expect(request.request.body.items[0]).toEqual({ menuItemId: 'item-1', quantity: 2 });
    request.flush({
      publicCode: 'BH-123',
      createdAt: '2026-08-13T18:00:00Z',
      orderType: 'Takeaway',
      status: 'Pending',
      deliveryAreaNameAr: null,
      deliveryAreaNameEn: null,
      address: null,
      subtotal: 170,
      deliveryFee: 0,
      total: 170,
      paymentMethod: 'Cash',
      paymentStatus: 'Pending',
    });

    expect(publicCode).toBe('BH-123');
    http.verify();
  });
});
