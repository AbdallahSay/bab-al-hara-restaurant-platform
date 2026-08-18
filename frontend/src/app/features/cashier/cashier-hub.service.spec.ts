import { TestBed } from '@angular/core/testing';
import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { CashierHubService } from './cashier-hub.service';

describe('CashierHubService', () => {
  it('starts disconnected before an authenticated connection is requested', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_ENVIRONMENT,
          useValue: {
            production: false,
            apiBaseUrl: '/api',
            cashierHubUrl: 'http://localhost/hubs/cashier',
          },
        },
      ],
    });

    const service = TestBed.inject(CashierHubService);
    expect(service.status()).toBe('disconnected');
    expect(service.orderCompleted$).toBeDefined();
    expect(service.orderDriverAssigned$).toBeDefined();
    expect(service.orderStatusChanged$).toBeDefined();
    expect(service.reconnected$).toBeDefined();
  });

  it('handles stop cleanly when disconnected', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: APP_ENVIRONMENT,
          useValue: {
            production: false,
            apiBaseUrl: '/api',
            cashierHubUrl: 'http://localhost/hubs/cashier',
          },
        },
      ],
    });

    const service = TestBed.inject(CashierHubService);
    await expect(service.stop()).resolves.toBeUndefined();
    expect(service.status()).toBe('disconnected');
  });
});
