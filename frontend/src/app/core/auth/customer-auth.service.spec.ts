import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { APP_ENVIRONMENT } from '../config/app-environment';
import { CustomerAuthService, CustomerSession } from './customer-auth.service';

describe('CustomerAuthService', () => {
  let service: CustomerAuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();

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

    service = TestBed.inject(CustomerAuthService);
    http = TestBed.inject(HttpTestingController);

    // Initial session request from constructor
    const sessionReq = http.expectOne('/api/customer/auth/session');
    sessionReq.flush({
      isAuthenticated: false,
      id: null,
      fullName: null,
      email: null,
      phoneNumber: null,
    });
  });

  afterEach(() => {
    try {
      http.verify();
    } finally {
      localStorage.clear();
      TestBed.resetTestingModule();
    }
  });

  it('initializes with unauthenticated session', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('signs in customer and updates session signal', () => {
    let result: CustomerSession | null = null;
    service.signIn('user@test.com', 'Pass123!').subscribe((res) => (result = res));

    http.expectOne('/api/security/csrf').flush({ requestToken: 'csrf-1' });

    const req = http.expectOne('/api/customer/auth/sign-in');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-1');
    req.flush({
      isAuthenticated: true,
      id: 'cust-uuid-1',
      fullName: 'خالد عبد الرحمن',
      email: 'user@test.com',
      phoneNumber: '01012345678',
    });

    expect(result).not.toBeNull();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.fullName).toBe('خالد عبد الرحمن');
  });

  it('signs out customer and resets session signal', () => {
    // 1. Sign in first
    service.signIn('user@test.com', 'Pass123!').subscribe();
    http.expectOne('/api/security/csrf').flush({ requestToken: 'csrf-1' });
    http.expectOne('/api/customer/auth/sign-in').flush({
      isAuthenticated: true,
      id: 'cust-uuid-1',
      fullName: 'خالد',
      email: 'user@test.com',
      phoneNumber: null,
    });

    expect(service.isAuthenticated()).toBe(true);

    // 2. Sign out
    service.signOut().subscribe();
    http
      .expectOne('/api/customer/auth/sign-out')
      .flush(null, { status: 204, statusText: 'No Content' });

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('fetches customer order history', () => {
    let ordersCount = 0;
    service.getOrders().subscribe((orders) => (ordersCount = orders.length));

    const req = http.expectOne('/api/customer/orders');
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        publicCode: 'BH-TEST-001',
        createdAt: '2026-11-16T10:00:00Z',
        status: 'Preparing',
        orderType: 'Takeaway',
        total: 180,
        itemCount: 2,
        deliveryAreaNameAr: null,
        deliveryAreaNameEn: null,
        address: null,
      },
    ]);

    expect(ordersCount).toBe(1);
  });
});
