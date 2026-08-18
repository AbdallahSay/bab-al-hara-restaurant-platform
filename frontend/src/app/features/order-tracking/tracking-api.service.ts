import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CustomerOrderTracking, ReorderPreview } from './order-tracking.models';

@Injectable({ providedIn: 'root' })
export class TrackingApiService {
  private readonly http = inject(HttpClient);

  getTracking(publicCode: string): Observable<CustomerOrderTracking> {
    return this.http.get<CustomerOrderTracking>(
      `/api/orders/track/${encodeURIComponent(publicCode)}`,
      { withCredentials: true },
    );
  }

  reorderPreview(publicCode: string): Observable<ReorderPreview> {
    return this.http.post<ReorderPreview>(
      `/api/orders/track/${encodeURIComponent(publicCode)}/reorder-preview`,
      {},
      { withCredentials: true },
    );
  }
}
