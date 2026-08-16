import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { CustomerApiService } from '../customer-ordering/customer-api.service';
import { KitchenApiService } from './kitchen-api.service';

describe('KitchenApiService', () => {
  let service: KitchenApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: APP_ENVIRONMENT,
          useValue: { production: false, apiBaseUrl: '/api', kitchenHubUrl: '/hubs/kitchen' },
        },
        {
          provide: CustomerApiService,
          useValue: {
            antiforgeryToken: () => of('mock-xsrf-token'),
          },
        },
      ],
    });
    service = TestBed.inject(KitchenApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('retrieves the active kitchen queue with credentials', () => {
    let count = 0;
    service.getActiveOrders().subscribe((orders) => (count = orders.length));

    const request = http.expectOne('/api/kitchen/orders/active');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush([{ publicCode: 'BH-1' }]);
    expect(count).toBe(1);
  });

  it('posts confirm order with antiforgery token', () => {
    let resultPublicCode = '';
    service.confirmOrder('BH-101').subscribe((res) => (resultPublicCode = res.publicCode));

    const request = http.expectOne('/api/kitchen/orders/BH-101/confirm');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('mock-xsrf-token');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ publicCode: 'BH-101', status: 'Confirmed' });
    expect(resultPublicCode).toBe('BH-101');
  });

  it('posts start-preparing with antiforgery token', () => {
    let resultStatus = '';
    service.startPreparing('BH-102').subscribe((res) => (resultStatus = res.status));

    const request = http.expectOne('/api/kitchen/orders/BH-102/start-preparing');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('mock-xsrf-token');
    request.flush({ publicCode: 'BH-102', status: 'Preparing' });
    expect(resultStatus).toBe('Preparing');
  });

  it('posts mark-ready with antiforgery token', () => {
    let resultStatus = '';
    service.markReady('BH-103').subscribe((res) => (resultStatus = res.status));

    const request = http.expectOne('/api/kitchen/orders/BH-103/mark-ready');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('mock-xsrf-token');
    request.flush({ publicCode: 'BH-103', status: 'Ready' });
    expect(resultStatus).toBe('Ready');
  });

  it('fetches menu items and categories', () => {
    let itemsCount = 0;
    let categoriesCount = 0;

    service.getMenuItems().subscribe((items) => (itemsCount = items.length));
    const itemsReq = http.expectOne('/api/menu/items');
    itemsReq.flush([{ id: 'item-1', nameAr: 'مشاوي', isAvailable: true }]);
    expect(itemsCount).toBe(1);

    service.getCategories().subscribe((cats) => (categoriesCount = cats.length));
    const catsReq = http.expectOne('/api/menu/categories');
    catsReq.flush([{ id: 'cat-1', nameAr: 'مشاوي' }]);
    expect(categoriesCount).toBe(1);
  });

  it('posts menu item availability change', () => {
    let updatedAvailable: boolean | undefined;
    service.updateMenuItemAvailability('item-123', false).subscribe((res) => {
      updatedAvailable = res.isAvailable;
    });

    const req = http.expectOne('/api/menu/items/item-123/availability');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ isAvailable: false });
    expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-xsrf-token');
    req.flush({ id: 'item-123', isAvailable: false });
    expect(updatedAvailable).toBe(false);
  });
});
