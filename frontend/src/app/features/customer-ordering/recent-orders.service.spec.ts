import { TestBed } from '@angular/core/testing';
import { RECENT_ORDERS_STORAGE_KEY, RecentOrdersService } from './recent-orders.service';

describe('RecentOrdersService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts with empty list when no stored orders exist', () => {
    const service = TestBed.inject(RecentOrdersService);
    expect(service.orders()).toEqual([]);
    expect(service.activeOrderCode()).toBeNull();
  });

  it('registers new orders and places the newest at the top', () => {
    const service = TestBed.inject(RecentOrdersService);
    service.registerOrder('ORD-1');
    service.registerOrder('ORD-2');

    const orders = service.orders();
    expect(orders.length).toBe(2);
    expect(orders[0]!.publicCode).toBe('ORD-2');
    expect(orders[1]!.publicCode).toBe('ORD-1');

    const storedRaw = localStorage.getItem(RECENT_ORDERS_STORAGE_KEY);
    expect(storedRaw).toBeTruthy();
    expect(JSON.parse(storedRaw!).length).toBe(2);
  });

  it('deduplicates when an existing order is re-registered and moves it to top', () => {
    const service = TestBed.inject(RecentOrdersService);
    service.registerOrder('ORD-1');
    service.registerOrder('ORD-2');
    service.registerOrder('ORD-1');

    const orders = service.orders();
    expect(orders.length).toBe(2);
    expect(orders[0]!.publicCode).toBe('ORD-1');
    expect(orders[1]!.publicCode).toBe('ORD-2');
  });

  it('bounds the list to a maximum of 10 recent orders', () => {
    const service = TestBed.inject(RecentOrdersService);
    for (let i = 1; i <= 15; i++) {
      service.registerOrder(`ORD-${i}`);
    }

    const orders = service.orders();
    expect(orders.length).toBe(10);
    expect(orders[0]!.publicCode).toBe('ORD-15');
    expect(orders[9]!.publicCode).toBe('ORD-6');
  });

  it('removes an order by publicCode and updates activeOrderCode if matched', () => {
    const service = TestBed.inject(RecentOrdersService);
    service.registerOrder('ORD-1');
    service.registerOrder('ORD-2');
    service.setActiveOrderCode('ORD-1');

    service.removeOrder('ORD-1');
    expect(service.orders().map((o) => o.publicCode)).toEqual(['ORD-2']);
    expect(service.activeOrderCode()).toBeNull();
  });

  it('handles corrupted localStorage JSON gracefully without throwing', () => {
    localStorage.setItem(RECENT_ORDERS_STORAGE_KEY, 'invalid-json{{{');
    const service = TestBed.inject(RecentOrdersService);
    expect(service.orders()).toEqual([]);

    service.registerOrder('ORD-VALID');
    expect(service.orders().length).toBe(1);
    expect(service.orders()[0]!.publicCode).toBe('ORD-VALID');
  });

  it('ignores invalid types and entries in localStorage', () => {
    localStorage.setItem(
      RECENT_ORDERS_STORAGE_KEY,
      JSON.stringify([
        null,
        123,
        { publicCode: '' },
        { publicCode: 'ORD-OK', lastSeenAtUtc: '2026-08-18T10:00:00Z' },
      ]),
    );

    const service = TestBed.inject(RecentOrdersService);
    expect(service.orders().length).toBe(1);
    expect(service.orders()[0]!.publicCode).toBe('ORD-OK');
  });

  it('clears all entries upon clearAll()', () => {
    const service = TestBed.inject(RecentOrdersService);
    service.registerOrder('ORD-1');
    service.setActiveOrderCode('ORD-1');

    service.clearAll();
    expect(service.orders()).toEqual([]);
    expect(service.activeOrderCode()).toBeNull();
    expect(localStorage.getItem(RECENT_ORDERS_STORAGE_KEY)).toBeNull();
  });
});
