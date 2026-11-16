import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';

import { CustomerContactProfileService } from '../../features/customer-ordering/customer-contact-profile.service';
import { CustomerApiService } from '../../features/customer-ordering/customer-api.service';
import { APP_ENVIRONMENT } from '../config/app-environment';

export interface CustomerSession {
  readonly isAuthenticated: boolean;
  readonly id: string | null;
  readonly fullName: string | null;
  readonly email: string | null;
  readonly phoneNumber: string | null;
}

export interface CustomerProfile {
  readonly id: string;
  readonly fullName: string;
  readonly email: string | null;
  readonly phoneNumber: string | null;
  readonly savedAddress: string | null;
  readonly preferredDeliveryAreaId: string | null;
  readonly createdAtUtc: string;
}

export interface CustomerOrderSummary {
  readonly publicCode: string;
  readonly createdAt: string;
  readonly status: string;
  readonly orderType: string;
  readonly total: number;
  readonly itemCount: number;
  readonly deliveryAreaNameAr: string | null;
  readonly deliveryAreaNameEn: string | null;
  readonly address: string | null;
}

const DEFAULT_UNAUTHENTICATED_SESSION: CustomerSession = {
  isAuthenticated: false,
  id: null,
  fullName: null,
  email: null,
  phoneNumber: null,
};

@Injectable({ providedIn: 'root' })
export class CustomerAuthService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(CustomerApiService);
  private readonly contactProfile = inject(CustomerContactProfileService);
  private readonly apiBaseUrl = inject(APP_ENVIRONMENT).apiBaseUrl;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly session = signal<CustomerSession>(DEFAULT_UNAUTHENTICATED_SESSION);
  readonly isAuthenticated = computed(() => this.session().isAuthenticated);
  readonly currentUser = computed(() => (this.isAuthenticated() ? this.session() : null));
  readonly isInitialized = signal<boolean>(false);

  constructor() {
    if (this.isBrowser) {
      this.refreshSession().subscribe();
    } else {
      this.isInitialized.set(true);
    }
  }

  refreshSession(): Observable<CustomerSession> {
    return this.http
      .get<CustomerSession>(`${this.apiBaseUrl}/customer/auth/session`, {
        withCredentials: true,
      })
      .pipe(
        tap((session) => {
          this.session.set(session);
          this.isInitialized.set(true);
          if (session.isAuthenticated && session.fullName) {
            this.contactProfile.save({
              name: session.fullName,
              phone: session.phoneNumber || session.email || '',
            });
          }
        }),
        catchError(() => {
          this.session.set(DEFAULT_UNAUTHENTICATED_SESSION);
          this.isInitialized.set(true);
          return of(DEFAULT_UNAUTHENTICATED_SESSION);
        }),
      );
  }

  signUp(name: string, phoneOrEmail: string, password: string): Observable<CustomerSession> {
    return this.api.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<CustomerSession>(
          `${this.apiBaseUrl}/customer/auth/register`,
          {
            fullName: name.trim(),
            phoneOrEmail: phoneOrEmail.trim(),
            password,
          },
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
      tap((session) => {
        this.session.set(session);
        if (session.isAuthenticated && session.fullName) {
          this.contactProfile.save({
            name: session.fullName,
            phone: session.phoneNumber || session.email || '',
          });
        }
      }),
    );
  }

  signIn(phoneOrEmail: string, password: string, rememberMe = true): Observable<CustomerSession> {
    return this.api.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<CustomerSession>(
          `${this.apiBaseUrl}/customer/auth/sign-in`,
          {
            phoneOrEmail: phoneOrEmail.trim(),
            password,
            rememberMe,
          },
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
      tap((session) => {
        this.session.set(session);
        if (session.isAuthenticated && session.fullName) {
          this.contactProfile.save({
            name: session.fullName,
            phone: session.phoneNumber || session.email || '',
          });
        }
      }),
    );
  }

  signOut(): Observable<void> {
    return this.api.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<void>(
          `${this.apiBaseUrl}/customer/auth/sign-out`,
          {},
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
      tap(() => {
        this.session.set(DEFAULT_UNAUTHENTICATED_SESSION);
      }),
      map(() => void 0),
      catchError(() => {
        this.session.set(DEFAULT_UNAUTHENTICATED_SESSION);
        return of(void 0);
      }),
    );
  }

  getProfile(): Observable<CustomerProfile> {
    return this.http.get<CustomerProfile>(`${this.apiBaseUrl}/customer/profile`, {
      withCredentials: true,
    });
  }

  updateProfile(data: {
    fullName: string;
    phoneNumber?: string;
    savedAddress?: string;
    preferredDeliveryAreaId?: string;
  }): Observable<CustomerProfile> {
    return this.api.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.put<CustomerProfile>(`${this.apiBaseUrl}/customer/profile`, data, {
          headers: { 'X-XSRF-TOKEN': token },
          withCredentials: true,
        }),
      ),
      tap((profile) => {
        this.session.update((current) => ({
          ...current,
          fullName: profile.fullName,
          phoneNumber: profile.phoneNumber,
        }));
        this.contactProfile.save({
          name: profile.fullName,
          phone: profile.phoneNumber || profile.email || '',
        });
      }),
    );
  }

  getOrders(): Observable<readonly CustomerOrderSummary[]> {
    return this.http.get<readonly CustomerOrderSummary[]>(`${this.apiBaseUrl}/customer/orders`, {
      withCredentials: true,
    });
  }
}
