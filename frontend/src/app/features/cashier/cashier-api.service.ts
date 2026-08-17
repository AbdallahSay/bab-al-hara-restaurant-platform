import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { CashierOrderDto, DriverSummaryDto } from './cashier.models';

export type HandoffResult = 'success' | 'stale' | 'error';
export type AssignDriverResult = 'success' | 'stale' | 'error';

@Injectable({ providedIn: 'root' })
export class CashierApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(APP_ENVIRONMENT).apiBaseUrl;

  getReadyOrders(): Observable<CashierOrderDto[]> {
    return this.http.get<CashierOrderDto[]>(`${this.apiBaseUrl}/cashier/orders`, {
      withCredentials: true,
    });
  }

  completeCashTakeaway(id: string, rowVersion: string): Observable<HandoffResult> {
    return this.http
      .post(
        `${this.apiBaseUrl}/orders/${id}/cash-payment/confirm`,
        { rowVersion },
        { withCredentials: true },
      )
      .pipe(
        map(() => 'success' as HandoffResult),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 409) {
            return of('stale' as HandoffResult);
          }
          return of('error' as HandoffResult);
        }),
      );
  }

  getDrivers(): Observable<DriverSummaryDto[]> {
    return this.http.get<DriverSummaryDto[]>(`${this.apiBaseUrl}/cashier/drivers`, {
      withCredentials: true,
    });
  }

  assignDriver(
    orderId: string,
    driverId: string,
    rowVersion: string,
  ): Observable<AssignDriverResult> {
    return this.http
      .post(
        `${this.apiBaseUrl}/orders/${orderId}/assign-driver`,
        { driverId, rowVersion },
        { withCredentials: true },
      )
      .pipe(
        map(() => 'success' as AssignDriverResult),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 409) {
            return of('stale' as AssignDriverResult);
          }
          return of('error' as AssignDriverResult);
        }),
      );
  }
}
