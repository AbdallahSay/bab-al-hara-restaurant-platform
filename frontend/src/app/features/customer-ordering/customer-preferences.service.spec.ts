import { TestBed } from '@angular/core/testing';
import {
  CHECKOUT_PREFERENCES_STORAGE_KEY,
  CustomerPreferencesService,
  SavedCheckoutPreferences,
} from './customer-preferences.service';

describe('CustomerPreferencesService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns null when no preferences are saved', () => {
    const service = TestBed.inject(CustomerPreferencesService);
    expect(service.getPreferences()).toBeNull();
    expect(service.preferences()).toBeNull();
  });

  it('saves and reads valid Delivery preferences with address and area', () => {
    const service = TestBed.inject(CustomerPreferencesService);
    service.savePreferences({
      orderType: 'Delivery',
      deliveryAreaId: 'area-123',
      deliveryAreaNameAr: 'مدينة نصر',
      deliveryAreaNameEn: 'Nasr City',
      address: '10 El-Nasr St, Building 4, Apt 12',
    });

    const expected: SavedCheckoutPreferences = {
      version: 1,
      orderType: 'Delivery',
      deliveryAreaId: 'area-123',
      deliveryAreaNameAr: 'مدينة نصر',
      deliveryAreaNameEn: 'Nasr City',
      address: '10 El-Nasr St, Building 4, Apt 12',
    };

    expect(service.getPreferences()).toEqual(expected);
    expect(service.preferences()).toEqual(expected);

    const storedRaw = localStorage.getItem(CHECKOUT_PREFERENCES_STORAGE_KEY);
    expect(storedRaw).toBeTruthy();
    expect(JSON.parse(storedRaw!)).toEqual(expected);
  });

  it('saves and reads valid Takeaway preferences', () => {
    const service = TestBed.inject(CustomerPreferencesService);
    service.savePreferences({
      orderType: 'Takeaway',
      deliveryAreaId: null,
      deliveryAreaNameAr: null,
      deliveryAreaNameEn: null,
      address: null,
    });

    expect(service.getPreferences()).toEqual({
      version: 1,
      orderType: 'Takeaway',
      deliveryAreaId: null,
      deliveryAreaNameAr: null,
      deliveryAreaNameEn: null,
      address: null,
    });
  });

  it('safely handles corrupted / invalid JSON in localStorage without crashing', () => {
    localStorage.setItem(CHECKOUT_PREFERENCES_STORAGE_KEY, '{invalid json');
    const service = TestBed.inject(CustomerPreferencesService);

    expect(service.getPreferences()).toBeNull();
    expect(localStorage.getItem(CHECKOUT_PREFERENCES_STORAGE_KEY)).toBeNull();
  });

  it('safely resets when storage version does not match', () => {
    localStorage.setItem(
      CHECKOUT_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        version: 99,
        orderType: 'Delivery',
        address: 'Old version address',
      }),
    );
    const service = TestBed.inject(CustomerPreferencesService);

    expect(service.getPreferences()).toBeNull();
    expect(localStorage.getItem(CHECKOUT_PREFERENCES_STORAGE_KEY)).toBeNull();
  });

  it('safely resets when orderType is invalid', () => {
    localStorage.setItem(
      CHECKOUT_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        orderType: 'DineIn',
        address: 'Some address',
      }),
    );
    const service = TestBed.inject(CustomerPreferencesService);

    expect(service.getPreferences()).toBeNull();
    expect(localStorage.getItem(CHECKOUT_PREFERENCES_STORAGE_KEY)).toBeNull();
  });

  it('clears saved address while preserving order type', () => {
    const service = TestBed.inject(CustomerPreferencesService);
    service.savePreferences({
      orderType: 'Delivery',
      deliveryAreaId: 'area-456',
      deliveryAreaNameAr: 'المعادي',
      deliveryAreaNameEn: 'Maadi',
      address: 'Street 9, Villa 5',
    });

    service.clearSavedAddress();

    const expected: SavedCheckoutPreferences = {
      version: 1,
      orderType: 'Delivery',
      deliveryAreaId: null,
      deliveryAreaNameAr: null,
      deliveryAreaNameEn: null,
      address: null,
    };

    expect(service.getPreferences()).toEqual(expected);
    const stored = JSON.parse(localStorage.getItem(CHECKOUT_PREFERENCES_STORAGE_KEY) ?? '{}');
    expect(stored).toEqual(expected);
  });

  it('clears all preferences completely with clearAll()', () => {
    const service = TestBed.inject(CustomerPreferencesService);
    service.savePreferences({
      orderType: 'Delivery',
      deliveryAreaId: 'area-789',
      deliveryAreaNameAr: 'الدقي',
      deliveryAreaNameEn: 'Dokki',
      address: 'Dokki Sq, 3rd floor',
    });

    service.clearAll();

    expect(service.getPreferences()).toBeNull();
    expect(localStorage.getItem(CHECKOUT_PREFERENCES_STORAGE_KEY)).toBeNull();
  });

  it('truncates overlong addresses and strings to safe limits', () => {
    const service = TestBed.inject(CustomerPreferencesService);
    const longAddress = 'A'.repeat(600);
    const longAreaId = 'B'.repeat(150);

    service.savePreferences({
      orderType: 'Delivery',
      deliveryAreaId: longAreaId,
      deliveryAreaNameAr: 'المنطقة',
      deliveryAreaNameEn: 'Area',
      address: longAddress,
    });

    const prefs = service.getPreferences();
    expect(prefs?.address?.length).toBe(500);
    expect(prefs?.deliveryAreaId?.length).toBe(100);
  });
});
