import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { DriverOrderDto } from './driver.models';

export type DriverActionResult = 'success' | 'stale' | 'error';

@Injectable({ providedIn: 'root' })
export class DriverApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(APP_ENVIRONMENT).apiBaseUrl;

  getAssignedOrders(): Observable<readonly DriverOrderDto[]> {
    return this.http.get<readonly DriverOrderDto[]>(`${this.apiBaseUrl}/driver/orders/assigned`, {
      withCredentials: true,
    });
  }

  startDelivery(id: string, rowVersion: string): Observable<DriverActionResult> {
    return this.http
      .post(
        `${this.apiBaseUrl}/orders/${id}/start-delivery`,
        { rowVersion },
        { withCredentials: true },
      )
      .pipe(
        map(() => 'success' as DriverActionResult),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 409) {
            return of('stale' as DriverActionResult);
          }
          return of('error' as DriverActionResult);
        }),
      );
  }

  markDelivered(id: string, rowVersion: string): Observable<DriverActionResult> {
    return this.http
      .post(
        `${this.apiBaseUrl}/orders/${id}/mark-delivered`,
        { rowVersion },
        { withCredentials: true },
      )
      .pipe(
        map(() => 'success' as DriverActionResult),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 409) {
            return of('stale' as DriverActionResult);
          }
          return of('error' as DriverActionResult);
        }),
      );
  }
}
