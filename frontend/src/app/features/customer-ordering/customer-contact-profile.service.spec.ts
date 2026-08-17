import { TestBed } from '@angular/core/testing';

import {
  CUSTOMER_CONTACT_STORAGE_KEY,
  CustomerContactProfileService,
} from './customer-contact-profile.service';

describe('CustomerContactProfileService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when storage is empty', () => {
    const service = TestBed.inject(CustomerContactProfileService);
    expect(service.profile()).toBeNull();
  });

  it('persists and restores valid contact profile', () => {
    const service = TestBed.inject(CustomerContactProfileService);
    service.save({ name: 'Mustafa Mahmoud', phone: '01012345678' });

    expect(service.profile()).toEqual({
      name: 'Mustafa Mahmoud',
      phone: '01012345678',
    });

    const stored = JSON.parse(
      localStorage.getItem(CUSTOMER_CONTACT_STORAGE_KEY) ?? '{}',
    ) as unknown;
    expect(stored).toEqual({
      name: 'Mustafa Mahmoud',
      phone: '01012345678',
    });
  });

  it('safely handles malformed JSON without crashing', () => {
    localStorage.setItem(CUSTOMER_CONTACT_STORAGE_KEY, 'invalid-json-{}');
    const service = TestBed.inject(CustomerContactProfileService);
    expect(service.profile()).toBeNull();
  });

  it('safely ignores empty or invalid contact fields', () => {
    localStorage.setItem(CUSTOMER_CONTACT_STORAGE_KEY, JSON.stringify({ name: '   ', phone: '' }));
    const service = TestBed.inject(CustomerContactProfileService);
    expect(service.profile()).toBeNull();
  });

  it('clears stored contact profile', () => {
    const service = TestBed.inject(CustomerContactProfileService);
    service.save({ name: 'Ahmed', phone: '01234567890' });
    expect(service.profile()).not.toBeNull();

    service.clear();
    expect(service.profile()).toBeNull();
    expect(localStorage.getItem(CUSTOMER_CONTACT_STORAGE_KEY)).toBeNull();
  });

  it('handles localStorage throwing errors (e.g. quota or privacy sandbox) gracefully', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const service = TestBed.inject(CustomerContactProfileService);
    expect(() => {
      service.save({ name: 'Sarah', phone: '01512345678' });
    }).not.toThrow();

    expect(service.profile()).toEqual({
      name: 'Sarah',
      phone: '01512345678',
    });
  });
});
