import { TestBed } from '@angular/core/testing';
import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { DriverHubService } from './driver-hub.service';

describe('DriverHubService', () => {
  it('starts disconnected before an authenticated connection is requested', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_ENVIRONMENT,
          useValue: {
            production: false,
            apiBaseUrl: '/api',
            kitchenHubUrl: 'http://localhost/hubs/kitchen',
            driverHubUrl: 'http://localhost/hubs/driver',
          },
        },
      ],
    });

    const service = TestBed.inject(DriverHubService);
    expect(service.status()).toBe('disconnected');
    expect(service.orderAssigned$).toBeDefined();
    expect(service.orderStatusChanged$).toBeDefined();
    expect(service.reconnected$).toBeDefined();
  });
});
