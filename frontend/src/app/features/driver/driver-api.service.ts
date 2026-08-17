import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { CustomerApiService } from '../customer-ordering/customer-api.service';
import { DriverOrderDto, TransitionResult } from './driver.models';

@Injectable({ providedIn: 'root' })
export class DriverApiService {
  private readonly http = inject(HttpClient);
  private readonly customerApi = inject(CustomerApiService);
  private readonly apiBaseUrl = inject(APP_ENVIRONMENT).apiBaseUrl;

  getAssignedOrders(): Observable<DriverOrderDto[]> {
    return this.http.get<DriverOrderDto[]>(`${this.apiBaseUrl}/driver/orders/assigned`, {
      withCredentials: true,
    });
  }

  startDelivery(id: string, rowVersion: string): Observable<TransitionResult> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<TransitionResult>(
          `${this.apiBaseUrl}/orders/${encodeURIComponent(id)}/start-delivery`,
          { rowVersion },
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }

  markDelivered(id: string, rowVersion: string): Observable<TransitionResult> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<TransitionResult>(
          `${this.apiBaseUrl}/orders/${encodeURIComponent(id)}/mark-delivered`,
          { rowVersion },
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }
}
