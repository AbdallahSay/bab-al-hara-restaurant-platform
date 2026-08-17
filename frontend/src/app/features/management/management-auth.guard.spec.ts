import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StaffSessionService } from '../kitchen/staff-session.service';
import { managementAuthGuard } from './management-auth.guard';

describe('managementAuthGuard', () => {
  let sessionMock: {
    getSession: ReturnType<typeof vi.fn>;
    getManagementSession: ReturnType<typeof vi.fn>;
  };
  let routerMock: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    sessionMock = {
      getSession: vi.fn(),
      getManagementSession: vi.fn(),
    };
    routerMock = {
      createUrlTree: vi.fn((commands: unknown[], extras?: unknown) => ({
        toString: () => '/management/sign-in',
        commands,
        extras,
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: StaffSessionService, useValue: sessionMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('allows access for authenticated staff', async () => {
    const sessionVal = {
      isAuthenticated: true,
      displayName: 'Manager',
      roles: ['Manager'],
    };
    sessionMock.getSession.mockReturnValue(of(sessionVal));
    sessionMock.getManagementSession.mockReturnValue(of(sessionVal));

    const guardResult = TestBed.runInInjectionContext(() =>
      managementAuthGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/management' } as RouterStateSnapshot,
      ),
    );

    const res = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;
    expect(res).toBe(true);
  });

  it('redirects unauthenticated users to sign-in with returnUrl', async () => {
    const sessionVal = {
      isAuthenticated: false,
      displayName: '',
      roles: [],
    };
    sessionMock.getSession.mockReturnValue(of(sessionVal));
    sessionMock.getManagementSession.mockReturnValue(of(sessionVal));

    const guardResult = TestBed.runInInjectionContext(() =>
      managementAuthGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/management/menu' } as RouterStateSnapshot,
      ),
    );

    const res = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/management/sign-in'], {
      queryParams: { returnUrl: '/management/menu' },
    });
    expect(res).toBeDefined();
  });

  it('redirects to sign-in when getSession errors', async () => {
    const err = throwError(() => new Error('Network error'));
    sessionMock.getSession.mockReturnValue(err);
    sessionMock.getManagementSession.mockReturnValue(err);

    const guardResult = TestBed.runInInjectionContext(() =>
      managementAuthGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/management' } as RouterStateSnapshot,
      ),
    );

    const res = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/management/sign-in'], {
      queryParams: { returnUrl: '/management' },
    });
    expect(res).toBeDefined();
  });
});
