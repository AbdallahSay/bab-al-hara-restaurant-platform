import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export const CHECKOUT_PREFERENCES_STORAGE_KEY = 'bab-al-hara.checkout-preferences.v1';

export interface SavedCheckoutPreferences {
  readonly version: 1;
  readonly orderType: 'Takeaway' | 'Delivery';
  readonly deliveryAreaId: string | null;
  readonly deliveryAreaNameAr: string | null;
  readonly deliveryAreaNameEn: string | null;
  readonly address: string | null;
}

@Injectable({ providedIn: 'root' })
export class CustomerPreferencesService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly preferences = signal<SavedCheckoutPreferences | null>(this.readStoredPreferences());

  getPreferences(): SavedCheckoutPreferences | null {
    return this.preferences();
  }

  savePreferences(prefs: Omit<SavedCheckoutPreferences, 'version'>): void {
    const orderType: 'Takeaway' | 'Delivery' =
      prefs.orderType === 'Delivery' ? 'Delivery' : 'Takeaway';
    const deliveryAreaId =
      typeof prefs.deliveryAreaId === 'string' && prefs.deliveryAreaId.trim()
        ? prefs.deliveryAreaId.trim().slice(0, 100)
        : null;
    const deliveryAreaNameAr =
      typeof prefs.deliveryAreaNameAr === 'string' && prefs.deliveryAreaNameAr.trim()
        ? prefs.deliveryAreaNameAr.trim().slice(0, 120)
        : null;
    const deliveryAreaNameEn =
      typeof prefs.deliveryAreaNameEn === 'string' && prefs.deliveryAreaNameEn.trim()
        ? prefs.deliveryAreaNameEn.trim().slice(0, 120)
        : null;
    const address =
      typeof prefs.address === 'string' && prefs.address.trim()
        ? prefs.address.trim().slice(0, 500)
        : null;

    const clean: SavedCheckoutPreferences = {
      version: 1,
      orderType,
      deliveryAreaId,
      deliveryAreaNameAr,
      deliveryAreaNameEn,
      address,
    };

    this.preferences.set(clean);

    if (this.isBrowser) {
      try {
        globalThis.localStorage.setItem(CHECKOUT_PREFERENCES_STORAGE_KEY, JSON.stringify(clean));
      } catch {
        // Ignore storage quotas or privacy restrictions
      }
    }
  }

  clearSavedAddress(): void {
    const current = this.preferences();
    const orderType = current?.orderType ?? 'Takeaway';
    const updated: SavedCheckoutPreferences = {
      version: 1,
      orderType,
      deliveryAreaId: null,
      deliveryAreaNameAr: null,
      deliveryAreaNameEn: null,
      address: null,
    };
    this.preferences.set(updated);

    if (this.isBrowser) {
      try {
        globalThis.localStorage.setItem(CHECKOUT_PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
    }
  }

  clearAll(): void {
    this.preferences.set(null);
    if (this.isBrowser) {
      try {
        globalThis.localStorage.removeItem(CHECKOUT_PREFERENCES_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }
  }

  private readStoredPreferences(): SavedCheckoutPreferences | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const raw = globalThis.localStorage.getItem(CHECKOUT_PREFERENCES_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) {
        this.safeRemoveStorage();
        return null;
      }

      const record = parsed as Record<string, unknown>;
      if (record['version'] !== 1) {
        this.safeRemoveStorage();
        return null;
      }

      const rawOrderType = record['orderType'];
      if (rawOrderType !== 'Takeaway' && rawOrderType !== 'Delivery') {
        this.safeRemoveStorage();
        return null;
      }

      const orderType: 'Takeaway' | 'Delivery' = rawOrderType;
      const deliveryAreaId =
        typeof record['deliveryAreaId'] === 'string' && record['deliveryAreaId'].trim()
          ? record['deliveryAreaId'].trim().slice(0, 100)
          : null;
      const deliveryAreaNameAr =
        typeof record['deliveryAreaNameAr'] === 'string' && record['deliveryAreaNameAr'].trim()
          ? record['deliveryAreaNameAr'].trim().slice(0, 120)
          : null;
      const deliveryAreaNameEn =
        typeof record['deliveryAreaNameEn'] === 'string' && record['deliveryAreaNameEn'].trim()
          ? record['deliveryAreaNameEn'].trim().slice(0, 120)
          : null;
      const address =
        typeof record['address'] === 'string' && record['address'].trim()
          ? record['address'].trim().slice(0, 500)
          : null;

      return {
        version: 1,
        orderType,
        deliveryAreaId,
        deliveryAreaNameAr,
        deliveryAreaNameEn,
        address,
      };
    } catch {
      this.safeRemoveStorage();
      return null;
    }
  }

  private safeRemoveStorage(): void {
    if (this.isBrowser) {
      try {
        globalThis.localStorage.removeItem(CHECKOUT_PREFERENCES_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  }
}
