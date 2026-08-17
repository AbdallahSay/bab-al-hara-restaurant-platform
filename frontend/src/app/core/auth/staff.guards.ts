import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { StaffSessionService } from '../../features/kitchen/staff-session.service';

export const kitchenGuard: CanActivateFn = () => {
  const sessionService = inject(StaffSessionService);
  const router = inject(Router);

  return sessionService.getKitchenSession().pipe(
    map((session) => (session.isAuthenticated ? true : router.createUrlTree(['/kitchen/sign-in']))),
    catchError(() => of(router.createUrlTree(['/kitchen/sign-in']))),
  );
};

export const cashierGuard: CanActivateFn = () => {
  const sessionService = inject(StaffSessionService);
  const router = inject(Router);

  return sessionService.getCashierSession().pipe(
    map((session) => (session.isAuthenticated ? true : router.createUrlTree(['/cashier/sign-in']))),
    catchError(() => of(router.createUrlTree(['/cashier/sign-in']))),
  );
};

export const driverGuard: CanActivateFn = () => {
  const sessionService = inject(StaffSessionService);
  const router = inject(Router);

  return sessionService.getDriverSession().pipe(
    map((session) => (session.isAuthenticated ? true : router.createUrlTree(['/driver/sign-in']))),
    catchError(() => of(router.createUrlTree(['/driver/sign-in']))),
  );
};

export const managementGuard: CanActivateFn = () => {
  const sessionService = inject(StaffSessionService);
  const router = inject(Router);

  return sessionService.getManagementSession().pipe(
    map((session) =>
      session.isAuthenticated ? true : router.createUrlTree(['/management/sign-in']),
    ),
    catchError(() => of(router.createUrlTree(['/management/sign-in']))),
  );
};
