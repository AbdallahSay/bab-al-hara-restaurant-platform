import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { OperationsRealtimeService } from './operations-realtime.service';

describe('OperationsRealtimeService', () => {
  it('starts disconnected before connection is requested', () => {
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
            operationsHubUrl: 'http://localhost/hubs/operations',
          },
        },
      ],
    });

    const service = TestBed.inject(OperationsRealtimeService);
    expect(service.status()).toBe('disconnected');
    expect(service.operationsUpdated$).toBeDefined();
    expect(service.orderCreated$).toBeDefined();
    expect(service.orderStatusChanged$).toBeDefined();
    expect(service.driverAssigned$).toBeDefined();
    expect(service.reconnected$).toBeDefined();
  });
});
