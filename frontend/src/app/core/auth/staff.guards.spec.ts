import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { StaffSessionService } from '../../features/kitchen/staff-session.service';
import { cashierGuard, driverGuard, kitchenGuard, managementGuard } from './staff.guards';

const dummyRoute = {} as ActivatedRouteSnapshot;
const dummyState = {} as RouterStateSnapshot;

describe('Staff Route Guards', () => {
  let sessionServiceSpy: {
    getKitchenSession: ReturnType<typeof vi.fn>;
    getCashierSession: ReturnType<typeof vi.fn>;
    getDriverSession: ReturnType<typeof vi.fn>;
    getManagementSession: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(() => {
    sessionServiceSpy = {
      getKitchenSession: vi.fn(),
      getCashierSession: vi.fn(),
      getDriverSession: vi.fn(),
      getManagementSession: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: StaffSessionService,
          useValue: sessionServiceSpy,
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  describe('kitchenGuard', () => {
    it('allows navigation when kitchen session is authenticated', () => {
      sessionServiceSpy.getKitchenSession.mockReturnValue(
        of({ isAuthenticated: true, displayName: 'Chef' }),
      );

      TestBed.runInInjectionContext(() => {
        const result$ = kitchenGuard(dummyRoute, dummyState) as Observable<boolean | UrlTree>;
        result$.subscribe((result: boolean | UrlTree) => {
          expect(result).toBe(true);
        });
      });
    });

    it('redirects to /kitchen/sign-in when kitchen session is not authenticated', () => {
      sessionServiceSpy.getKitchenSession.mockReturnValue(
        of({ isAuthenticated: false, displayName: null }),
      );

      TestBed.runInInjectionContext(() => {
        const result$ = kitchenGuard(dummyRoute, dummyState) as Observable<boolean | UrlTree>;
        result$.subscribe((result: boolean | UrlTree) => {
          expect(result instanceof UrlTree).toBe(true);
          expect(router.serializeUrl(result as UrlTree)).toBe('/kitchen/sign-in');
        });
      });
    });

    it('redirects to /kitchen/sign-in when session check errors', () => {
      sessionServiceSpy.getKitchenSession.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      TestBed.runInInjectionContext(() => {
        const result$ = kitchenGuard(dummyRoute, dummyState) as Observable<boolean | UrlTree>;
        result$.subscribe((result: boolean | UrlTree) => {
          expect(result instanceof UrlTree).toBe(true);
          expect(router.serializeUrl(result as UrlTree)).toBe('/kitchen/sign-in');
        });
      });
    });
  });

  describe('cashierGuard', () => {
    it('allows navigation when cashier session is authenticated', () => {
      sessionServiceSpy.getCashierSession.mockReturnValue(
        of({ isAuthenticated: true, displayName: 'Cashier' }),
      );

      TestBed.runInInjectionContext(() => {
        const result$ = cashierGuard(dummyRoute, dummyState) as Observable<boolean | UrlTree>;
        result$.subscribe((result: boolean | UrlTree) => {
          expect(result).toBe(true);
        });
      });
    });

    it('redirects to /cashier/sign-in when cashier session is not authenticated', () => {
      sessionServiceSpy.getCashierSession.mockReturnValue(
        of({ isAuthenticated: false, displayName: null }),
      );

      TestBed.runInInjectionContext(() => {
        const result$ = cashierGuard(dummyRoute, dummyState) as Observable<boolean | UrlTree>;
        result$.subscribe((result: boolean | UrlTree) => {
          expect(result instanceof UrlTree).toBe(true);
          expect(router.serializeUrl(result as UrlTree)).toBe('/cashier/sign-in');
        });
      });
    });

    it('redirects to /cashier/sign-in when session check errors', () => {
      sessionServiceSpy.getCashierSession.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      TestBed.runInInjectionContext(() => {
        const result$ = cashierGuard(dummyRoute, dummyState) as Observable<boolean | UrlTree>;
        result$.subscribe((result: boolean | UrlTree) => {
          expect(result instanceof UrlTree).toBe(true);
          expect(router.serializeUrl(result as UrlTree)).toBe('/cashier/sign-in');
        });
      });
    });
  });

  describe('driverGuard', () => {
    it('allows navigation when driver session is authenticated', () => {
      sessionServiceSpy.getDriverSession.mockReturnValue(
        of({ isAuthenticated: true, displayName: 'Driver' }),
      );

      TestBed.runInInjectionContext(() => {
        const result$ = driverGuard(dummyRoute, dummyState) as Observable<boolean | UrlTree>;
        result$.subscribe((result: boolean | UrlTree) => {
          expect(result).toBe(true);
        });
      });
    });

    it('redirects to /driver/sign-in when driver session is not authenticated', () => {
      sessionServiceSpy.getDriverSession.mockReturnValue(
        of({ isAuthenticated: false, displayName: null }),
      );

      TestBed.runInInjectionContext(() => {
        const result$ = driverGuard(dummyRoute, dummyState) as Observable<boolean | UrlTree>;
        result$.subscribe((result: boolean | UrlTree) => {
          expect(result instanceof UrlTree).toBe(true);
          expect(router.serializeUrl(result as UrlTree)).toBe('/driver/sign-in');
        });
      });
    });

    it('redirects to /driver/sign-in when session check errors', () => {
      sessionServiceSpy.getDriverSession.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      TestBed.runInInjectionContext(() => {
        const result$ = driverGuard(dummyRoute, dummyState) as Observable<boolean | UrlTree>;
        result$.subscribe((result: boolean | UrlTree) => {
          expect(result instanceof UrlTree).toBe(true);
          expect(router.serializeUrl(result as UrlTree)).toBe('/driver/sign-in');
        });
      });
    });
  });

  describe('managementGuard', () => {
    it('allows navigation when management session is authenticated', () => {
      sessionServiceSpy.getManagementSession.mockReturnValue(
        of({ isAuthenticated: true, displayName: 'Manager' }),
      );

      TestBed.runInInjectionContext(() => {
        const result$ = managementGuard(dummyRoute, dummyState) as Observable<boolean | UrlTree>;
        result$.subscribe((result: boolean | UrlTree) => {
          expect(result).toBe(true);
        });
      });
    });

    it('redirects to /management/sign-in when management session is not authenticated', () => {
      sessionServiceSpy.getManagementSession.mockReturnValue(
        of({ isAuthenticated: false, displayName: null }),
      );

      TestBed.runInInjectionContext(() => {
        const result$ = managementGuard(dummyRoute, dummyState) as Observable<boolean | UrlTree>;
        result$.subscribe((result: boolean | UrlTree) => {
          expect(result instanceof UrlTree).toBe(true);
          expect(router.serializeUrl(result as UrlTree)).toBe('/management/sign-in');
        });
      });
    });

    it('redirects to /management/sign-in when session check errors', () => {
      sessionServiceSpy.getManagementSession.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      TestBed.runInInjectionContext(() => {
        const result$ = managementGuard(dummyRoute, dummyState) as Observable<boolean | UrlTree>;
        result$.subscribe((result: boolean | UrlTree) => {
          expect(result instanceof UrlTree).toBe(true);
          expect(router.serializeUrl(result as UrlTree)).toBe('/management/sign-in');
        });
      });
    });
  });
});
