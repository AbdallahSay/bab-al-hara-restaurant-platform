import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';

import { CashierOrderDto } from './cashier.models';
import { CashierApiService } from './cashier-api.service';
import { CashierPage } from './cashier-page';
import { CashierHubService } from './cashier-hub.service';
import { StaffSessionService } from '../kitchen/staff-session.service';

const INITIAL_ORDER_TAKEAWAY: CashierOrderDto = {
  id: '1',
  publicCode: 'TAKE1',
  createdAt: '2026-08-13T18:00:00Z',
  orderType: 'Takeaway',
  status: 'Ready',
  customerName: 'Ahmed',
  deliveryAreaNameAr: null,
  deliveryAreaNameEn: null,
  address: null,
  customerNote: null,
  subtotal: 100,
  deliveryFee: 0,
  total: 100,
  paymentMethod: 'Cash',
  paymentStatus: 'Pending',
  rowVersion: 'v1',
  items: [],
};

const INITIAL_ORDER_DELIVERY: CashierOrderDto = {
  ...INITIAL_ORDER_TAKEAWAY,
  id: '2',
  publicCode: 'DEL2',
  orderType: 'Delivery',
  deliveryAreaNameEn: 'Area',
  deliveryAreaNameAr: 'Area',
  address: '123 St',
};

describe('CashierPage', () => {
  it('renders order list on load', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY, INITIAL_ORDER_DELIVERY]);
    expect(fixture.nativeElement.textContent).toContain('TAKE1');
    expect(fixture.nativeElement.textContent).toContain('DEL2');
  });

  it('shows Delivery orders with waiting-for-driver (no handoff button)', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_DELIVERY]);
    expect(fixture.nativeElement.textContent).toContain('بانتظار السائق');
    expect(fixture.nativeElement.querySelector('.handoff-button')).toBeFalsy();
  });

  it('shows Takeaway orders with handoff button', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY]);
    expect(fixture.nativeElement.querySelector('.handoff-button')).toBeTruthy();
  });

  it('SignalR OrderCompleted removes order from list', async () => {
    const { fixture, orderCompleted } = await createFixture([
      INITIAL_ORDER_TAKEAWAY,
      INITIAL_ORDER_DELIVERY,
    ]);

    orderCompleted.next('1');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('TAKE1');
    expect(fixture.nativeElement.textContent).toContain('DEL2');
  });

  async function createFixture(orders: readonly CashierOrderDto[]) {
    const orderCompleted = new Subject<string>();
    await TestBed.configureTestingModule({
      imports: [CashierPage],
      providers: [
        provideRouter([]),
        {
          provide: StaffSessionService,
          useValue: { getSession: () => of({ isAuthenticated: true }) },
        },
        {
          provide: CashierApiService,
          useValue: {
            getReadyOrders: () => of(orders),
            completeCashTakeaway: () => of('success'),
          },
        },
        {
          provide: CashierHubService,
          useValue: {
            status: () => 'connected',
            orderCompleted$: orderCompleted,
            reconnected$: new Subject<void>(),
            start: () => Promise.resolve(),
            stop: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashierPage);
    fixture.detectChanges();
    return { fixture, orderCompleted };
  }
});
