import { TestBed } from '@angular/core/testing';

import { TrackingCredentialService } from './tracking-credential.service';

describe('TrackingCredentialService', () => {
  let service: TrackingCredentialService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackingCredentialService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('stores and retrieves token scoped per publicCode', () => {
    service.store('BH-001', 'token-abc-123');
    service.store('BH-002', 'token-xyz-789');

    expect(service.getToken('BH-001')).toBe('token-abc-123');
    expect(service.getToken('BH-002')).toBe('token-xyz-789');
  });

  it('returns null for unknown publicCode', () => {
    expect(service.getToken('BH-UNKNOWN')).toBeNull();
  });

  it('clears stored token for a specific publicCode', () => {
    service.store('BH-001', 'token-abc-123');
    service.store('BH-002', 'token-xyz-789');

    service.clear('BH-001');

    expect(service.getToken('BH-001')).toBeNull();
    expect(service.getToken('BH-002')).toBe('token-xyz-789');
  });
});
