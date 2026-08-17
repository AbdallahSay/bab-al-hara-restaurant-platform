import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export const CUSTOMER_CONTACT_STORAGE_KEY = 'bab-al-hara.customer-contact.v1';

export interface CustomerContactProfile {
  readonly name: string;
  readonly phone: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerContactProfileService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly profile = signal<CustomerContactProfile | null>(this.readStoredContact());

  save(profile: CustomerContactProfile): void {
    const trimmedName = profile.name.trim().slice(0, 120);
    const trimmedPhone = profile.phone.trim().slice(0, 20);

    if (!trimmedName || !trimmedPhone) {
      return;
    }

    const cleanProfile: CustomerContactProfile = {
      name: trimmedName,
      phone: trimmedPhone,
    };

    this.profile.set(cleanProfile);

    if (this.isBrowser) {
      try {
        globalThis.localStorage.setItem(CUSTOMER_CONTACT_STORAGE_KEY, JSON.stringify(cleanProfile));
      } catch {
        // Ignore storage quotas or privacy restrictions
      }
    }
  }

  clear(): void {
    this.profile.set(null);
    if (this.isBrowser) {
      try {
        globalThis.localStorage.removeItem(CUSTOMER_CONTACT_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }
  }

  private readStoredContact(): CustomerContactProfile | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const raw = globalThis.localStorage.getItem(CUSTOMER_CONTACT_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'name' in parsed &&
        'phone' in parsed &&
        typeof (parsed as { name: unknown }).name === 'string' &&
        typeof (parsed as { phone: unknown }).phone === 'string'
      ) {
        const name = (parsed as { name: string }).name.trim();
        const phone = (parsed as { phone: string }).phone.trim();
        if (name.length > 0 && phone.length > 0) {
          return {
            name: name.slice(0, 120),
            phone: phone.slice(0, 20),
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  }
}
