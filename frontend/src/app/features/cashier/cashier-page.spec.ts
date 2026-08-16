import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { StaffSessionService } from '../kitchen/staff-session.service';
import { CashierApiService } from './cashier-api.service';
import { CashierHubService } from './cashier-hub.service';
import { CashierPage } from './cashier-page';
import {
  CashierOrderDto,
  CashierOrderStatusChangedEvent,
  DriverSummaryDto,
  OrderDriverAssignedEvent,
} from './cashier.models';

const MOCK_DRIVERS: DriverSummaryDto[] = [
  { id: 'd1', name: 'أحمد السائق', phone: '01011111111', isAvailable: true },
  { id: 'd2', name: 'محمود السائق', phone: '01022222222', isAvailable: true },
];

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

const INITIAL_ORDER_DELIVERY_UNASSIGNED: CashierOrderDto = {
  ...INITIAL_ORDER_TAKEAWAY,
  id: '2',
  publicCode: 'DEL2',
  orderType: 'Delivery',
  deliveryAreaNameEn: 'Maadi',
  deliveryAreaNameAr: 'المعادي',
  address: '123 St',
  driverId: null,
  driverName: null,
};

const INITIAL_ORDER_DELIVERY_ASSIGNED: CashierOrderDto = {
  ...INITIAL_ORDER_DELIVERY_UNASSIGNED,
  id: '3',
  publicCode: 'DEL3',
  driverId: 'd1',
  driverName: 'أحمد السائق',
  driverAssignedAtUtc: '2026-08-13T18:05:00Z',
};

describe('CashierPage', () => {
  it('renders order list on load', async () => {
    const { fixture } = await createFixture([
      INITIAL_ORDER_TAKEAWAY,
      INITIAL_ORDER_DELIVERY_UNASSIGNED,
    ]);
    expect(fixture.nativeElement.textContent).toContain('TAKE1');
    expect(fixture.nativeElement.textContent).toContain('DEL2');
  });

  it('shows Takeaway orders with handoff button and no driver selector', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY]);
    expect(fixture.nativeElement.querySelector('.handoff-button')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.driver-select')).toBeFalsy();
  });

  it('shows unassigned Delivery orders with driver selector and assign button (no takeaway handoff)', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_DELIVERY_UNASSIGNED]);
    expect(fixture.nativeElement.querySelector('.handoff-button')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.driver-select')).toBeTruthy();
    const assignBtn = fixture.nativeElement.querySelector(
      '.assign-driver-button',
    ) as HTMLButtonElement;
    expect(assignBtn).toBeTruthy();
    expect(assignBtn.disabled).toBe(true);
  });

  it('executes driver assignment flow with confirmation and updates order', async () => {
    let assignedArgs: { orderId: string; driverId: string; rowVersion: string } | undefined;
    const { fixture } = await createFixture([INITIAL_ORDER_DELIVERY_UNASSIGNED], MOCK_DRIVERS, {
      assignDriver: (orderId, driverId, rowVersion) => {
        assignedArgs = { orderId, driverId, rowVersion };
        return of('success');
      },
    });

    const selectEl = fixture.nativeElement.querySelector('.driver-select') as HTMLSelectElement;
    selectEl.value = 'd1';
    selectEl.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const assignBtn = fixture.nativeElement.querySelector(
      '.assign-driver-button',
    ) as HTMLButtonElement;
    expect(assignBtn.disabled).toBe(false);
    assignBtn.click();
    fixture.detectChanges();

    // Confirmation dialog appears
    const confirmModal = fixture.nativeElement.querySelector('.assignment-confirm');
    expect(confirmModal).toBeTruthy();
    expect(confirmModal.textContent).toContain('أحمد السائق');

    // Click confirm
    const confirmYesBtn = fixture.nativeElement.querySelector(
      '.assignment-confirm .button--primary',
    ) as HTMLButtonElement;
    confirmYesBtn.click();
    fixture.detectChanges();

    expect(assignedArgs).toEqual({ orderId: '2', driverId: 'd1', rowVersion: 'v1' });

    // Order now prominently displays assigned driver and status
    expect(fixture.nativeElement.querySelector('.assigned-driver-card')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('أحمد السائق');
    // Cashier cannot mark OnTheWay or Delivered (no transition buttons)
    expect(fixture.nativeElement.querySelector('.handoff-button')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.driver-select')).toBeFalsy();
  });

  it('handles stale 409 error when assigning driver', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_DELIVERY_UNASSIGNED], MOCK_DRIVERS, {
      assignDriver: () => of('stale'),
    });

    const selectEl = fixture.nativeElement.querySelector('.driver-select') as HTMLSelectElement;
    selectEl.value = 'd1';
    selectEl.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const assignBtn = fixture.nativeElement.querySelector(
      '.assign-driver-button',
    ) as HTMLButtonElement;
    assignBtn.click();
    fixture.detectChanges();

    const confirmYesBtn = fixture.nativeElement.querySelector(
      '.assignment-confirm .button--primary',
    ) as HTMLButtonElement;
    confirmYesBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.error-text')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('تم تعديل الطلب من قبل مستخدم آخر');
  });

  it('prominently displays assigned driver on already assigned delivery order without driver actions', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_DELIVERY_ASSIGNED]);
    const driverCard = fixture.nativeElement.querySelector('.assigned-driver-card');
    expect(driverCard).toBeTruthy();
    expect(driverCard.textContent).toContain('أحمد السائق');
    expect(driverCard.textContent).toContain('السائق');
    expect(fixture.nativeElement.querySelector('.handoff-button')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.driver-select')).toBeFalsy();
  });

  it('SignalR OrderDriverAssigned live updates driver info', async () => {
    const { fixture, orderDriverAssigned } = await createFixture([
      INITIAL_ORDER_DELIVERY_UNASSIGNED,
    ]);

    expect(fixture.nativeElement.querySelector('.driver-select')).toBeTruthy();

    orderDriverAssigned.next({
      orderId: '2',
      driverId: 'd2',
      driverName: 'محمود السائق',
      driverAssignedAtUtc: '2026-08-13T18:10:00Z',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.driver-select')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.assigned-driver-card')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('محمود السائق');
  });

  it('SignalR OrderStatusChanged updates order status and removes on Delivered', async () => {
    const { fixture, orderStatusChanged } = await createFixture([INITIAL_ORDER_DELIVERY_ASSIGNED]);

    expect(fixture.nativeElement.textContent).toContain('DEL3');

    // Status changed to OnTheWay
    orderStatusChanged.next({
      orderId: '3',
      newStatus: 'OnTheWay',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('في الطريق');

    // Status changed to Delivered -> removes from active cashier view
    orderStatusChanged.next({
      orderId: '3',
      newStatus: 'Delivered',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('DEL3');
  });

  it('SignalR OrderCompleted removes order from list', async () => {
    const { fixture, orderCompleted } = await createFixture([
      INITIAL_ORDER_TAKEAWAY,
      INITIAL_ORDER_DELIVERY_ASSIGNED,
    ]);

    orderCompleted.next('1');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('TAKE1');
    expect(fixture.nativeElement.textContent).toContain('DEL3');
  });

  async function createFixture(
    orders: readonly CashierOrderDto[],
    drivers: readonly DriverSummaryDto[] = MOCK_DRIVERS,
    apiOverrides: Partial<CashierApiService> = {},
  ) {
    const orderCompleted = new Subject<string>();
    const orderDriverAssigned = new Subject<OrderDriverAssignedEvent>();
    const orderStatusChanged = new Subject<CashierOrderStatusChangedEvent>();
    const reconnected = new Subject<void>();

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
            getDrivers: () => of(drivers),
            completeCashTakeaway: () => of('success'),
            assignDriver: () => of('success'),
            ...apiOverrides,
          },
        },
        {
          provide: CashierHubService,
          useValue: {
            status: () => 'connected',
            orderCompleted$: orderCompleted,
            orderDriverAssigned$: orderDriverAssigned,
            orderStatusChanged$: orderStatusChanged,
            reconnected$: reconnected,
            start: () => Promise.resolve(),
            stop: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CashierPage);
    fixture.detectChanges();
    return {
      fixture,
      orderCompleted,
      orderDriverAssigned,
      orderStatusChanged,
      reconnected,
    };
  }
});
