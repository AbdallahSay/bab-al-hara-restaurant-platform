import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { CustomerApiService } from '../customer-ordering/customer-api.service';
import { Category, KitchenOrder, MenuItem } from '../customer-ordering/order.models';

@Injectable({ providedIn: 'root' })
export class KitchenApiService {
  private readonly http = inject(HttpClient);
  private readonly customerApi = inject(CustomerApiService);
  private readonly apiBaseUrl = inject(APP_ENVIRONMENT).apiBaseUrl;

  getActiveOrders(): Observable<readonly KitchenOrder[]> {
    return this.http.get<readonly KitchenOrder[]>(`${this.apiBaseUrl}/kitchen/orders/active`, {
      withCredentials: true,
    });
  }

  confirmOrder(publicCode: string): Observable<KitchenOrder> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<KitchenOrder>(
          `${this.apiBaseUrl}/kitchen/orders/${encodeURIComponent(publicCode)}/confirm`,
          {},
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }

  startPreparing(publicCode: string): Observable<KitchenOrder> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<KitchenOrder>(
          `${this.apiBaseUrl}/kitchen/orders/${encodeURIComponent(publicCode)}/start-preparing`,
          {},
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }

  markReady(publicCode: string): Observable<KitchenOrder> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<KitchenOrder>(
          `${this.apiBaseUrl}/kitchen/orders/${encodeURIComponent(publicCode)}/mark-ready`,
          {},
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }

  getMenuItems(): Observable<readonly MenuItem[]> {
    return this.http.get<readonly MenuItem[]>(`${this.apiBaseUrl}/menu/items`, {
      withCredentials: true,
    });
  }

  getCategories(): Observable<readonly Category[]> {
    return this.http.get<readonly Category[]>(`${this.apiBaseUrl}/menu/categories`, {
      withCredentials: true,
    });
  }

  updateMenuItemAvailability(
    menuItemId: string,
    isAvailable: boolean,
  ): Observable<{ readonly id: string; readonly isAvailable: boolean }> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<{ readonly id: string; readonly isAvailable: boolean }>(
          `${this.apiBaseUrl}/menu/items/${encodeURIComponent(menuItemId)}/availability`,
          { isAvailable },
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }
}
