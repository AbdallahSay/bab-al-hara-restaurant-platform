import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { CashierApiService } from './cashier-api.service';
import { CashierOrderDto } from './cashier.models';

describe('CashierApiService', () => {
  let service: CashierApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: APP_ENVIRONMENT,
          useValue: { apiBaseUrl: 'http://test.api', cashierHubUrl: 'http://test.hub' },
        },
      ],
    });
    service = TestBed.inject(CashierApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getReadyOrders', () => {
    it('should make GET /api/cashier/orders', () => {
      const mockOrders: CashierOrderDto[] = [
        {
          id: '123',
          publicCode: '1234',
          createdAt: '2023-01-01T00:00:00Z',
          orderType: 'Takeaway',
          status: 'Ready',
          customerName: 'John Doe',
          deliveryAreaNameAr: null,
          deliveryAreaNameEn: null,
          address: null,
          customerNote: null,
          subtotal: 100,
          deliveryFee: 0,
          total: 100,
          paymentMethod: 'Cash',
          paymentStatus: 'Pending',
          rowVersion: 'v1',
          items: [],
        },
      ];

      let result: CashierOrderDto[] | undefined;
      service.getReadyOrders().subscribe((data) => (result = data));

      const req = httpTesting.expectOne('http://test.api/cashier/orders');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockOrders);

      expect(result).toEqual(mockOrders);
    });
  });

  describe('completeCashTakeaway', () => {
    it('should make POST /api/orders/{id}/cash-payment/confirm', () => {
      let result: string | undefined;
      service.completeCashTakeaway('123', 'v1').subscribe((res) => (result = res));

      const req = httpTesting.expectOne('http://test.api/orders/123/cash-payment/confirm');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ rowVersion: 'v1' });
      req.flush({});

      expect(result).toBe('success');
    });

    it('should return stale on 409', () => {
      let result: string | undefined;
      service.completeCashTakeaway('123', 'v1').subscribe((res) => (result = res));

      const req = httpTesting.expectOne('http://test.api/orders/123/cash-payment/confirm');
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });

      expect(result).toBe('stale');
    });

    it('should return error on other errors', () => {
      let result: string | undefined;
      service.completeCashTakeaway('123', 'v1').subscribe((res) => (result = res));

      const req = httpTesting.expectOne('http://test.api/orders/123/cash-payment/confirm');
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });

      expect(result).toBe('error');
    });
  });

  describe('getDrivers', () => {
    it('should make GET /api/cashier/drivers', () => {
      const mockDrivers = [
        { id: 'd1', name: 'Ahmed Driver', phone: '01000000001', isAvailable: true },
        { id: 'd2', name: 'Mahmoud Driver', phone: '01000000002', isAvailable: false },
      ];

      let result: unknown;
      service.getDrivers().subscribe((data) => (result = data));

      const req = httpTesting.expectOne('http://test.api/cashier/drivers');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockDrivers);

      expect(result).toEqual(mockDrivers);
    });
  });

  describe('assignDriver', () => {
    it('should make POST /api/orders/{id}/assign-driver', () => {
      let result: string | undefined;
      service.assignDriver('order-123', 'driver-456', 'v1').subscribe((res) => (result = res));

      const req = httpTesting.expectOne('http://test.api/orders/order-123/assign-driver');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toEqual({ driverId: 'driver-456', rowVersion: 'v1' });
      req.flush({});

      expect(result).toBe('success');
    });

    it('should return stale on 409 Conflict', () => {
      let result: string | undefined;
      service.assignDriver('order-123', 'driver-456', 'v1').subscribe((res) => (result = res));

      const req = httpTesting.expectOne('http://test.api/orders/order-123/assign-driver');
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });

      expect(result).toBe('stale');
    });

    it('should return error on 500 error', () => {
      let result: string | undefined;
      service.assignDriver('order-123', 'driver-456', 'v1').subscribe((res) => (result = res));

      const req = httpTesting.expectOne('http://test.api/orders/order-123/assign-driver');
      req.flush('Server Error', { status: 500, statusText: 'Server Error' });

      expect(result).toBe('error');
    });
  });
});
