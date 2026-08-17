import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { CustomerApiService } from '../customer-ordering/customer-api.service';
import {
  CashierSessionService,
  DriverSessionService,
  KitchenSessionService,
  StaffSession,
  StaffSessionService,
} from './staff-session.service';

describe('StaffSessionService & Portal Services', () => {
  let staffSession: StaffSessionService;
  let kitchenSession: KitchenSessionService;
  let cashierSession: CashierSessionService;
  let driverSession: DriverSessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: APP_ENVIRONMENT,
          useValue: { production: false, apiBaseUrl: '/api' },
        },
        {
          provide: CustomerApiService,
          useValue: {
            antiforgeryToken: () => of('mock-xsrf-token'),
          },
        },
      ],
    });

    staffSession = TestBed.inject(StaffSessionService);
    kitchenSession = TestBed.inject(KitchenSessionService);
    cashierSession = TestBed.inject(CashierSessionService);
    driverSession = TestBed.inject(DriverSessionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe('Kitchen Portal Session', () => {
    it('gets kitchen session via /api/staff/session/kitchen', () => {
      let result: StaffSession | undefined;
      kitchenSession.getSession().subscribe((s) => (result = s));

      const req = http.expectOne('/api/staff/session/kitchen');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ isAuthenticated: true, displayName: 'Chef Ali', role: 'Kitchen' });

      expect(result).toEqual({ isAuthenticated: true, displayName: 'Chef Ali', role: 'Kitchen' });
    });

    it('signs in to kitchen portal with XSRF header', () => {
      let result: StaffSession | undefined;
      kitchenSession.signIn('chef@test.local', 'Secret123!').subscribe((s) => (result = s));

      const req = http.expectOne('/api/staff/session/kitchen');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-xsrf-token');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toEqual({ email: 'chef@test.local', password: 'Secret123!' });
      req.flush({ isAuthenticated: true, displayName: 'Chef Ali', role: 'Kitchen' });

      expect(result).toEqual({ isAuthenticated: true, displayName: 'Chef Ali', role: 'Kitchen' });
    });

    it('signs out of kitchen portal specifically', () => {
      let signedOut = false;
      kitchenSession.signOut().subscribe(() => (signedOut = true));

      const req = http.expectOne('/api/staff/session/kitchen');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-xsrf-token');
      expect(req.request.withCredentials).toBe(true);
      req.flush(null);

      expect(signedOut).toBe(true);
    });
  });

  describe('Cashier Portal Session', () => {
    it('gets cashier session via /api/staff/session/cashier', () => {
      let result: StaffSession | undefined;
      cashierSession.getSession().subscribe((s) => (result = s));

      const req = http.expectOne('/api/staff/session/cashier');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ isAuthenticated: true, displayName: 'Cashier Sara', role: 'Cashier' });

      expect(result).toEqual({
        isAuthenticated: true,
        displayName: 'Cashier Sara',
        role: 'Cashier',
      });
    });

    it('signs in to cashier portal with XSRF header', () => {
      let result: StaffSession | undefined;
      cashierSession.signIn('cashier@test.local', 'Secret123!').subscribe((s) => (result = s));

      const req = http.expectOne('/api/staff/session/cashier');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-xsrf-token');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toEqual({ email: 'cashier@test.local', password: 'Secret123!' });
      req.flush({ isAuthenticated: true, displayName: 'Cashier Sara', role: 'Cashier' });

      expect(result).toEqual({
        isAuthenticated: true,
        displayName: 'Cashier Sara',
        role: 'Cashier',
      });
    });

    it('signs out of cashier portal specifically', () => {
      let signedOut = false;
      cashierSession.signOut().subscribe(() => (signedOut = true));

      const req = http.expectOne('/api/staff/session/cashier');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-xsrf-token');
      expect(req.request.withCredentials).toBe(true);
      req.flush(null);

      expect(signedOut).toBe(true);
    });
  });

  describe('Driver Portal Session', () => {
    it('gets driver session via /api/staff/session/driver', () => {
      let result: StaffSession | undefined;
      driverSession.getSession().subscribe((s) => (result = s));

      const req = http.expectOne('/api/staff/session/driver');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ isAuthenticated: true, displayName: 'Driver Tarek', role: 'Driver' });

      expect(result).toEqual({
        isAuthenticated: true,
        displayName: 'Driver Tarek',
        role: 'Driver',
      });
    });

    it('signs in to driver portal with XSRF header', () => {
      let result: StaffSession | undefined;
      driverSession.signIn('driver@test.local', 'Secret123!').subscribe((s) => (result = s));

      const req = http.expectOne('/api/staff/session/driver');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-xsrf-token');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toEqual({ email: 'driver@test.local', password: 'Secret123!' });
      req.flush({ isAuthenticated: true, displayName: 'Driver Tarek', role: 'Driver' });

      expect(result).toEqual({
        isAuthenticated: true,
        displayName: 'Driver Tarek',
        role: 'Driver',
      });
    });

    it('signs out of driver portal specifically', () => {
      let signedOut = false;
      driverSession.signOut().subscribe(() => (signedOut = true));

      const req = http.expectOne('/api/staff/session/driver');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('mock-xsrf-token');
      expect(req.request.withCredentials).toBe(true);
      req.flush(null);

      expect(signedOut).toBe(true);
    });
  });

  describe('Management Portal Session', () => {
    it('gets and signs in to management portal', () => {
      let session: StaffSession | undefined;
      staffSession.getManagementSession().subscribe((s) => (session = s));

      const getReq = http.expectOne('/api/staff/session/management');
      getReq.flush({ isAuthenticated: true, displayName: 'Manager Admin', role: 'Manager' });
      expect(session).toEqual({
        isAuthenticated: true,
        displayName: 'Manager Admin',
        role: 'Manager',
      });

      staffSession.signInManagement('mgr@test.local', 'Secret123!').subscribe();
      const postReq = http.expectOne('/api/staff/session/management');
      expect(postReq.request.method).toBe('POST');
      postReq.flush({ isAuthenticated: true, displayName: 'Manager Admin', role: 'Manager' });
    });
  });
});
