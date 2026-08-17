import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { CustomerApiService } from '../customer-ordering/customer-api.service';

export type StaffPortal = 'kitchen' | 'cashier' | 'driver' | 'management';

export interface StaffSession {
  readonly isAuthenticated: boolean;
  readonly displayName: string | null;
  readonly role?: string | null;
}

@Injectable({ providedIn: 'root' })
export class StaffSessionService {
  private readonly http = inject(HttpClient);
  private readonly customerApi = inject(CustomerApiService);
  private readonly apiBaseUrl = inject(APP_ENVIRONMENT).apiBaseUrl;

  getSession(portal: StaffPortal = 'kitchen'): Observable<StaffSession> {
    return this.http.get<StaffSession>(`${this.apiBaseUrl}/staff/session/${portal}`, {
      withCredentials: true,
    });
  }

  signIn(
    email: string,
    password: string,
    portal: StaffPortal = 'kitchen',
  ): Observable<StaffSession> {
    return this.customerApi
      .antiforgeryToken()
      .pipe(
        switchMap((token) =>
          this.http.post<StaffSession>(
            `${this.apiBaseUrl}/staff/session/${portal}`,
            { email, password },
            { headers: { 'X-XSRF-TOKEN': token }, withCredentials: true },
          ),
        ),
      );
  }

  signOut(portal: StaffPortal = 'kitchen'): Observable<void> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.delete<void>(`${this.apiBaseUrl}/staff/session/${portal}`, {
          headers: { 'X-XSRF-TOKEN': token },
          withCredentials: true,
        }),
      ),
    );
  }

  getKitchenSession(): Observable<StaffSession> {
    return this.getSession('kitchen');
  }

  signInKitchen(email: string, password: string): Observable<StaffSession> {
    return this.signIn(email, password, 'kitchen');
  }

  signOutKitchen(): Observable<void> {
    return this.signOut('kitchen');
  }

  getCashierSession(): Observable<StaffSession> {
    return this.getSession('cashier');
  }

  signInCashier(email: string, password: string): Observable<StaffSession> {
    return this.signIn(email, password, 'cashier');
  }

  signOutCashier(): Observable<void> {
    return this.signOut('cashier');
  }

  getDriverSession(): Observable<StaffSession> {
    return this.getSession('driver');
  }

  signInDriver(email: string, password: string): Observable<StaffSession> {
    return this.signIn(email, password, 'driver');
  }

  signOutDriver(): Observable<void> {
    return this.signOut('driver');
  }

  getManagementSession(): Observable<StaffSession> {
    return this.getSession('management');
  }

  signInManagement(email: string, password: string): Observable<StaffSession> {
    return this.signIn(email, password, 'management');
  }

  signOutManagement(): Observable<void> {
    return this.signOut('management');
  }
}

@Injectable({ providedIn: 'root' })
export class KitchenSessionService {
  private readonly staffSession = inject(StaffSessionService);

  getSession(): Observable<StaffSession> {
    return this.staffSession.getKitchenSession();
  }

  signIn(email: string, password: string): Observable<StaffSession> {
    return this.staffSession.signInKitchen(email, password);
  }

  signOut(): Observable<void> {
    return this.staffSession.signOutKitchen();
  }
}

@Injectable({ providedIn: 'root' })
export class CashierSessionService {
  private readonly staffSession = inject(StaffSessionService);

  getSession(): Observable<StaffSession> {
    return this.staffSession.getCashierSession();
  }

  signIn(email: string, password: string): Observable<StaffSession> {
    return this.staffSession.signInCashier(email, password);
  }

  signOut(): Observable<void> {
    return this.staffSession.signOutCashier();
  }
}

@Injectable({ providedIn: 'root' })
export class DriverSessionService {
  private readonly staffSession = inject(StaffSessionService);

  getSession(): Observable<StaffSession> {
    return this.staffSession.getDriverSession();
  }

  signIn(email: string, password: string): Observable<StaffSession> {
    return this.staffSession.signInDriver(email, password);
  }

  signOut(): Observable<void> {
    return this.staffSession.signOutDriver();
  }
}
