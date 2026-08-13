import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { CustomerApiService } from '../customer-ordering/customer-api.service';

export interface StaffSession {
  readonly isAuthenticated: boolean;
  readonly displayName: string | null;
}

@Injectable({ providedIn: 'root' })
export class StaffSessionService {
  private readonly http = inject(HttpClient);
  private readonly customerApi = inject(CustomerApiService);
  private readonly sessionUrl = `${inject(APP_ENVIRONMENT).apiBaseUrl}/staff/session`;

  getSession(): Observable<StaffSession> {
    return this.http.get<StaffSession>(this.sessionUrl, { withCredentials: true });
  }

  signIn(email: string, password: string): Observable<StaffSession> {
    return this.customerApi
      .antiforgeryToken()
      .pipe(
        switchMap((token) =>
          this.http.post<StaffSession>(
            this.sessionUrl,
            { email, password },
            { headers: { 'X-XSRF-TOKEN': token }, withCredentials: true },
          ),
        ),
      );
  }

  signOut(): Observable<void> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.delete<void>(this.sessionUrl, {
          headers: { 'X-XSRF-TOKEN': token },
          withCredentials: true,
        }),
      ),
    );
  }
}
