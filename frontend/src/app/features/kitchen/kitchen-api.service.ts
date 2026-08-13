import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { KitchenOrder } from '../customer-ordering/order.models';

@Injectable({ providedIn: 'root' })
export class KitchenApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(APP_ENVIRONMENT).apiBaseUrl;

  getActiveOrders(): Observable<readonly KitchenOrder[]> {
    return this.http.get<readonly KitchenOrder[]>(`${this.apiBaseUrl}/kitchen/orders/active`, {
      withCredentials: true,
    });
  }
}
