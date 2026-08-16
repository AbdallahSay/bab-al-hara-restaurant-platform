import { TestBed } from '@angular/core/testing';
import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { KitchenRealtimeService } from './kitchen-realtime.service';

describe('KitchenRealtimeService', () => {
  it('starts disconnected before an authenticated connection is requested', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_ENVIRONMENT,
          useValue: {
            production: false,
            apiBaseUrl: '/api',
            kitchenHubUrl: 'http://localhost/hubs/kitchen',
          },
        },
      ],
    });

    const service = TestBed.inject(KitchenRealtimeService);
    expect(service.status()).toBe('disconnected');
    expect(service.newOrders$).toBeDefined();
    expect(service.statusChanged$).toBeDefined();
    expect(service.availabilityChanged$).toBeDefined();
    expect(service.reconnected$).toBeDefined();
  });
});
