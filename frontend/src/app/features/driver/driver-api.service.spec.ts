import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { DriverApiService } from './driver-api.service';
import { DriverOrderDto } from './driver.models';

describe('DriverApiService', () => {
  let service: DriverApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: APP_ENVIRONMENT,
          useValue: {
            apiBaseUrl: 'http://test.api',
            kitchenHubUrl: 'http://test.hub/kitchen',
            cashierHubUrl: 'http://test.hub/cashier',
            driverHubUrl: 'http://test.hub/driver',
          },
        },
      ],
    });
    service = TestBed.inject(DriverApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getAssignedOrders', () => {
    it('should fetch assigned orders via GET /api/driver/orders/assigned', () => {
      const mockOrders: DriverOrderDto[] = [
        {
          id: 'ord-1',
          publicCode: 'BH-1001',
          createdAt: '2026-08-17T12:00:00Z',
          orderType: 'Delivery',
          status: 'Ready',
          customerName: 'Kareem',
          customerPhone: '01012345678',
          deliveryAreaNameAr: 'الدقي',
          deliveryAreaNameEn: 'Dokki',
          address: 'شارع التحرير مبنى 15 الدور 3',
          customerNote: 'رن الجرس',
          subtotal: 250,
          deliveryFee: 20,
          total: 270,
          paymentMethod: 'Cash',
          paymentStatus: 'Pending',
          rowVersion: 'row-v1',
          items: [{ productNameAr: 'كباب مشوي', productNameEn: 'Grilled Kebab', quantity: 2 }],
        },
      ];

      let result: readonly DriverOrderDto[] | undefined;
      service.getAssignedOrders().subscribe((data) => (result = data));

      const req = httpTesting.expectOne('http://test.api/driver/orders/assigned');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockOrders);

      expect(result).toEqual(mockOrders);
    });
  });

  describe('startDelivery', () => {
    it('should send POST /api/orders/{id}/start-delivery with rowVersion', () => {
      let result: string | undefined;
      service.startDelivery('ord-1', 'row-v1').subscribe((res) => (result = res));

      const req = httpTesting.expectOne('http://test.api/orders/ord-1/start-delivery');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ rowVersion: 'row-v1' });
      req.flush({});

      expect(result).toBe('success');
    });

    it('should return stale when 409 conflict occurs', () => {
      let result: string | undefined;
      service.startDelivery('ord-1', 'row-v1').subscribe((res) => (result = res));

      const req = httpTesting.expectOne('http://test.api/orders/ord-1/start-delivery');
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });

      expect(result).toBe('stale');
    });

    it('should return error on other http errors', () => {
      let result: string | undefined;
      service.startDelivery('ord-1', 'row-v1').subscribe((res) => (result = res));

      const req = httpTesting.expectOne('http://test.api/orders/ord-1/start-delivery');
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });

      expect(result).toBe('error');
    });
  });

  describe('markDelivered', () => {
    it('should send POST /api/orders/{id}/mark-delivered with rowVersion', () => {
      let result: string | undefined;
      service.markDelivered('ord-1', 'row-v1').subscribe((res) => (result = res));

      const req = httpTesting.expectOne('http://test.api/orders/ord-1/mark-delivered');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ rowVersion: 'row-v1' });
      req.flush({});

      expect(result).toBe('success');
    });

    it('should return stale on 409 conflict', () => {
      let result: string | undefined;
      service.markDelivered('ord-1', 'row-v1').subscribe((res) => (result = res));

      const req = httpTesting.expectOne('http://test.api/orders/ord-1/mark-delivered');
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });

      expect(result).toBe('stale');
    });

    it('should return error on generic failure', () => {
      let result: string | undefined;
      service.markDelivered('ord-1', 'row-v1').subscribe((res) => (result = res));

      const req = httpTesting.expectOne('http://test.api/orders/ord-1/mark-delivered');
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });

      expect(result).toBe('error');
    });
  });
});
