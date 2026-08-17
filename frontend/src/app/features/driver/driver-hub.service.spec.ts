import { TestBed } from '@angular/core/testing';
import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { DriverHubService } from './driver-hub.service';

describe('DriverHubService', () => {
  it('starts disconnected before connection is explicitly started', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_ENVIRONMENT,
          useValue: {
            production: false,
            apiBaseUrl: '/api',
            kitchenHubUrl: 'http://localhost/hubs/kitchen',
            cashierHubUrl: 'http://localhost/hubs/cashier',
            driverHubUrl: 'http://localhost/hubs/driver',
          },
        },
      ],
    });

    const service = TestBed.inject(DriverHubService);
    expect(service.status()).toBe('disconnected');
    expect(service.orderAssigned$).toBeDefined();
    expect(service.orderUpdated$).toBeDefined();
    expect(service.orderCompleted$).toBeDefined();
    expect(service.reconnected$).toBeDefined();
  });
});
