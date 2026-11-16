import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay, switchMap } from 'rxjs';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import {
  Category,
  CreateOrderRequest,
  CreatedOrder,
  DeliveryArea,
  MenuItem,
  RestaurantPublicStatusResponse,
} from './order.models';

export interface ContactInquiryRequest {
  readonly name: string;
  readonly phoneOrEmail: string;
  readonly subject?: string;
  readonly message: string;
}

export interface ContactInquiryResponse {
  readonly id: string;
  readonly createdAtUtc: string;
  readonly success: boolean;
}

@Injectable({ providedIn: 'root' })
export class CustomerApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(APP_ENVIRONMENT).apiBaseUrl;
  private antiforgeryToken$?: Observable<string>;

  getCategories(): Observable<readonly Category[]> {
    return this.http.get<readonly Category[]>(`${this.apiBaseUrl}/menu/categories`);
  }

  getMenuItems(): Observable<readonly MenuItem[]> {
    return this.http.get<readonly MenuItem[]>(`${this.apiBaseUrl}/menu/items`);
  }

  getDeliveryAreas(): Observable<readonly DeliveryArea[]> {
    return this.http.get<readonly DeliveryArea[]>(`${this.apiBaseUrl}/delivery-areas`);
  }

  getRestaurantStatus(): Observable<RestaurantPublicStatusResponse> {
    return this.http.get<RestaurantPublicStatusResponse>(`${this.apiBaseUrl}/restaurant/status`);
  }

  createOrder(request: CreateOrderRequest): Observable<CreatedOrder> {
    return this.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<CreatedOrder>(`${this.apiBaseUrl}/orders`, request, {
          headers: { 'X-XSRF-TOKEN': token },
          withCredentials: true,
        }),
      ),
    );
  }

  submitContactInquiry(request: ContactInquiryRequest): Observable<ContactInquiryResponse> {
    return this.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<ContactInquiryResponse>(`${this.apiBaseUrl}/contact`, request, {
          headers: { 'X-XSRF-TOKEN': token },
          withCredentials: true,
        }),
      ),
    );
  }

  antiforgeryToken(): Observable<string> {
    this.antiforgeryToken$ ??= this.http
      .get<{ readonly requestToken: string }>(`${this.apiBaseUrl}/security/csrf`, {
        withCredentials: true,
      })
      .pipe(
        switchMap((response) => [response.requestToken]),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.antiforgeryToken$;
  }
}
