import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StaffSessionService } from '../kitchen/staff-session.service';
import { managementAuthGuard } from './management-auth.guard';

describe('managementAuthGuard', () => {
  let sessionMock: { getSession: ReturnType<typeof vi.fn> };
  let routerMock: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    sessionMock = {
      getSession: vi.fn(),
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
    sessionMock.getSession.mockReturnValue(
      of({
        isAuthenticated: true,
        displayName: 'Manager',
        roles: ['Manager'],
      }),
    );

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
    sessionMock.getSession.mockReturnValue(
      of({
        isAuthenticated: false,
        displayName: '',
        roles: [],
      }),
    );

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
    sessionMock.getSession.mockReturnValue(throwError(() => new Error('Network error')));

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
