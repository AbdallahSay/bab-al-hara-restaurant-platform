import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { KitchenApiService } from './kitchen-api.service';

describe('KitchenApiService', () => {
  it('retrieves the persisted active kitchen queue with credentials', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: APP_ENVIRONMENT,
          useValue: { production: false, apiBaseUrl: '/api', kitchenHubUrl: '/hubs/kitchen' },
        },
      ],
    });
    const service = TestBed.inject(KitchenApiService);
    const http = TestBed.inject(HttpTestingController);
    let count = 0;

    service.getActiveOrders().subscribe((orders) => (count = orders.length));
    const request = http.expectOne('/api/kitchen/orders/active');
    expect(request.request.withCredentials).toBe(true);
    request.flush([{ publicCode: 'BH-1' }]);
    expect(count).toBe(1);
  });
});
