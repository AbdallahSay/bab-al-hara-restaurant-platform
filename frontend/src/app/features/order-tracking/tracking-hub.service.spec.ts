import { TestBed } from '@angular/core/testing';
import { HubConnectionState } from '@microsoft/signalr';

import { TrackingHubService } from './tracking-hub.service';

describe('TrackingHubService', () => {
  let service: TrackingHubService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TrackingHubService],
    });
    service = TestBed.inject(TrackingHubService);
  });

  afterEach(() => {
    void service.stopConnection();
  });

  it('starts in disconnected state and exposes observables', () => {
    expect(service.connectionState$.value).toBe(HubConnectionState.Disconnected);
    expect(service.trackingUpdate$).toBeDefined();
    expect(service.reconnected$).toBeDefined();
  });
});
