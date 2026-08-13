import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { CreatedOrder } from '../order.models';

const RECEIPT_STORAGE_KEY = 'bab-al-hara.last-order';

export interface OrderReceipt {
  readonly order: CreatedOrder;
  readonly displayedTotalChanged: boolean;
}

@Injectable({ providedIn: 'root' })
export class OrderReceiptService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly current = signal<OrderReceipt | null>(this.read());

  save(receipt: OrderReceipt): void {
    this.current.set(receipt);
    if (this.isBrowser) {
      globalThis.sessionStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(receipt));
    }
  }

  private read(): OrderReceipt | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const value = globalThis.sessionStorage.getItem(RECEIPT_STORAGE_KEY);
      return value ? (JSON.parse(value) as OrderReceipt) : null;
    } catch {
      return null;
    }
  }
}
