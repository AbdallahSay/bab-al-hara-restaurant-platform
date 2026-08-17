import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CustomerOrderTracking } from './order-tracking.models';

@Injectable({ providedIn: 'root' })
export class TrackingApiService {
  private readonly http = inject(HttpClient);

  getTracking(publicCode: string, token: string): Observable<CustomerOrderTracking> {
    const headers = new HttpHeaders({ 'X-Tracking-Token': token });
    return this.http.get<CustomerOrderTracking>(`/api/orders/track/${publicCode}`, { headers });
  }
}
