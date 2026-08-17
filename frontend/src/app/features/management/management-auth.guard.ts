import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { StaffSessionService } from '../kitchen/staff-session.service';

export const managementAuthGuard: CanActivateFn = (_route, state) => {
  const staffSession = inject(StaffSessionService);
  const router = inject(Router);

  return staffSession.getSession().pipe(
    map((session) => {
      if (session.isAuthenticated) {
        return true;
      }
      return router.createUrlTree(['/management/sign-in'], {
        queryParams: { returnUrl: state.url },
      });
    }),
    catchError(() => {
      return of(
        router.createUrlTree(['/management/sign-in'], {
          queryParams: { returnUrl: state.url },
        }),
      );
    }),
  );
};
