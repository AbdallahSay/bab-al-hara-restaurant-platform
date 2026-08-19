import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export const RECENT_ORDERS_STORAGE_KEY = 'bab-al-hara.recent-orders.v1';
const MAX_RECENT_ORDERS = 10;

export interface RecentOrderEntry {
  readonly publicCode: string;
  readonly lastSeenAtUtc: string;
}

@Injectable({ providedIn: 'root' })
export class RecentOrdersService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly orders = signal<readonly RecentOrderEntry[]>(this.readStoredOrders());
  readonly activeOrderCode = signal<string | null>(null);

  registerOrder(publicCode: string): void {
    const trimmed = typeof publicCode === 'string' ? publicCode.trim() : '';
    if (!trimmed || trimmed.length > 64) {
      return;
    }

    const now = new Date().toISOString();
    const current = this.orders();
    const filtered = current.filter((entry) => entry.publicCode !== trimmed);
    const updated = [{ publicCode: trimmed, lastSeenAtUtc: now }, ...filtered].slice(
      0,
      MAX_RECENT_ORDERS,
    );

    this.orders.set(updated);
    this.persist(updated);
  }

  removeOrder(publicCode: string): void {
    const trimmed = typeof publicCode === 'string' ? publicCode.trim() : '';
    if (!trimmed) {
      return;
    }

    const updated = this.orders().filter((entry) => entry.publicCode !== trimmed);
    this.orders.set(updated);
    this.persist(updated);

    if (this.activeOrderCode() === trimmed) {
      this.activeOrderCode.set(null);
    }
  }

  setActiveOrderCode(publicCode: string | null): void {
    const trimmed = typeof publicCode === 'string' ? publicCode.trim() : null;
    this.activeOrderCode.set(trimmed || null);
  }

  clearAll(): void {
    this.orders.set([]);
    this.activeOrderCode.set(null);
    if (this.isBrowser) {
      try {
        globalThis.localStorage.removeItem(RECENT_ORDERS_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }
  }

  private persist(orders: readonly RecentOrderEntry[]): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      globalThis.localStorage.setItem(RECENT_ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // Ignore quota/privacy storage errors
    }
  }

  private readStoredOrders(): readonly RecentOrderEntry[] {
    if (!this.isBrowser) {
      return [];
    }

    try {
      const raw = globalThis.localStorage.getItem(RECENT_ORDERS_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      const validEntries: RecentOrderEntry[] = [];
      const seenCodes = new Set<string>();

      for (const item of parsed) {
        if (
          typeof item === 'object' &&
          item !== null &&
          'publicCode' in item &&
          'lastSeenAtUtc' in item &&
          typeof (item as { publicCode: unknown }).publicCode === 'string' &&
          typeof (item as { lastSeenAtUtc: unknown }).lastSeenAtUtc === 'string'
        ) {
          const code = (item as { publicCode: string }).publicCode.trim();
          const timestamp = (item as { lastSeenAtUtc: string }).lastSeenAtUtc.trim();

          if (code.length > 0 && code.length <= 64 && !seenCodes.has(code)) {
            seenCodes.add(code);
            validEntries.push({
              publicCode: code,
              lastSeenAtUtc: timestamp || new Date().toISOString(),
            });
            if (validEntries.length >= MAX_RECENT_ORDERS) {
              break;
            }
          }
        }
      }

      return validEntries;
    } catch {
      return [];
    }
  }
}
