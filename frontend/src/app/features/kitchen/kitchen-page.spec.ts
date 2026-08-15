import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';

import { KitchenOrder } from '../customer-ordering/order.models';
import { KitchenApiService } from './kitchen-api.service';
import { KitchenPage } from './kitchen-page';
import { KitchenRealtimeService } from './kitchen-realtime.service';
import { StaffSessionService } from './staff-session.service';

const INITIAL_ORDER: KitchenOrder = {
  publicCode: 'BH-INITIAL',
  createdAt: '2026-08-13T18:00:00Z',
  orderType: 'Takeaway',
  status: 'Pending',
  customerName: 'Ahmed',
  deliveryAreaNameAr: null,
  deliveryAreaNameEn: null,
  address: null,
  customerNote: 'بدون بصل',
  items: [{ productNameAr: 'سندوتش كفتة', productNameEn: 'Kofta sandwich', quantity: 2 }],
};

describe('KitchenPage', () => {
  it('renders the persisted initial queue', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER]);

    expect(fixture.nativeElement.textContent).toContain('BH-INITIAL');
    expect(fixture.nativeElement.textContent).toContain('2×');
    expect(fixture.nativeElement.textContent).toContain('بدون بصل');
  });

  it('upserts a realtime order without page refresh and shows a strong alert', async () => {
    const { fixture, newOrders } = await createFixture([]);

    newOrders.next({ ...INITIAL_ORDER, publicCode: 'BH-LIVE' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.new-order-banner').textContent).toContain(
      'BH-LIVE',
    );
    expect(fixture.nativeElement.querySelector('.order-ticket').textContent).toContain('BH-LIVE');
  });

  it('refetches persisted state after SignalR reconnect', async () => {
    let calls = 0;
    const reconnected = new Subject<void>();
    await TestBed.configureTestingModule({
      imports: [KitchenPage],
      providers: [
        provideRouter([]),
        {
          provide: StaffSessionService,
          useValue: { getSession: () => of({ isAuthenticated: true }) },
        },
        {
          provide: KitchenApiService,
          useValue: {
            getActiveOrders: () => {
              calls += 1;
              return of([]);
            },
          },
        },
        {
          provide: KitchenRealtimeService,
          useValue: {
            status: () => 'connected',
            newOrders$: new Subject<KitchenOrder>(),
            reconnected$: reconnected,
            start: () => Promise.resolve(),
            stop: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(KitchenPage);
    fixture.detectChanges();
    expect(calls).toBe(1);

    reconnected.next();
    fixture.detectChanges();

    expect(calls).toBe(2);
  });

  async function createFixture(orders: readonly KitchenOrder[]) {
    const newOrders = new Subject<KitchenOrder>();
    await TestBed.configureTestingModule({
      imports: [KitchenPage],
      providers: [
        provideRouter([]),
        {
          provide: StaffSessionService,
          useValue: { getSession: () => of({ isAuthenticated: true }) },
        },
        { provide: KitchenApiService, useValue: { getActiveOrders: () => of(orders) } },
        {
          provide: KitchenRealtimeService,
          useValue: {
            status: () => 'connected',
            newOrders$: newOrders,
            reconnected$: new Subject<void>(),
            start: () => Promise.resolve(),
            stop: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(KitchenPage);
    fixture.detectChanges();
    return { fixture, newOrders };
  }
});
