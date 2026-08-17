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
  createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  orderType: 'Takeaway',
  status: 'Ready',
  customerName: 'Ahmed Mahmoud',
  deliveryAreaNameAr: null,
  deliveryAreaNameEn: null,
  address: null,
  customerNote: 'بدون شطة',
  subtotal: 150,
  deliveryFee: 0,
  total: 150,
  paymentMethod: 'Cash',
  paymentStatus: 'Pending',
  rowVersion: 'v1',
  items: [
    {
      productNameAr: 'مشاوي مشكل',
      productNameEn: 'Mixed Grill',
      quantity: 2,
    },
  ],
};

const INITIAL_ORDER_DELIVERY_UNASSIGNED: CashierOrderDto = {
  id: '2',
  publicCode: 'DEL2',
  createdAt: new Date(Date.now() - 25 * 60_000).toISOString(),
  orderType: 'Delivery',
  status: 'Ready',
  customerName: 'Sara Ali',
  deliveryAreaNameAr: 'المعادي',
  deliveryAreaNameEn: 'Maadi',
  address: 'شارع 9 المعادي',
  customerNote: null,
  subtotal: 200,
  deliveryFee: 25,
  total: 225,
  paymentMethod: 'Cash',
  paymentStatus: 'Paid',
  rowVersion: 'v2',
  items: [
    {
      productNameAr: 'شاورما دجاج',
      productNameEn: 'Chicken Shawarma',
      quantity: 1,
    },
  ],
  driverId: null,
  driverName: null,
};

const INITIAL_ORDER_DELIVERY_ASSIGNED: CashierOrderDto = {
  ...INITIAL_ORDER_DELIVERY_UNASSIGNED,
  id: '3',
  publicCode: 'DEL3',
  driverId: 'd1',
  driverName: 'أحمد السائق',
  driverAssignedAtUtc: new Date(Date.now() - 10 * 60_000).toISOString(),
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
      '.assignment-confirm .btn-confirm',
    ) as HTMLButtonElement;
    confirmYesBtn.click();
    fixture.detectChanges();

    expect(assignedArgs).toEqual({ orderId: '2', driverId: 'd1', rowVersion: 'v2' });

    // Order now prominently displays assigned driver and status
    expect(fixture.nativeElement.querySelector('.assigned-driver-card')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('أحمد السائق');
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
      '.assignment-confirm .btn-confirm',
    ) as HTMLButtonElement;
    confirmYesBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.error-badge--stale')).toBeTruthy();
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

  it('filters queue by filter pills', async () => {
    const { fixture } = await createFixture([
      INITIAL_ORDER_TAKEAWAY,
      INITIAL_ORDER_DELIVERY_UNASSIGNED,
    ]);
    const filterPills = fixture.nativeElement.querySelectorAll(
      '.filter-pill',
    ) as NodeListOf<HTMLButtonElement>;

    // Click Takeaway filter
    filterPills[1]?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('TAKE1');
    expect(fixture.nativeElement.textContent).not.toContain('DEL2');

    // Click Delivery filter
    filterPills[2]?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('TAKE1');
    expect(fixture.nativeElement.textContent).toContain('DEL2');

    // Click All filter
    filterPills[0]?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('TAKE1');
    expect(fixture.nativeElement.textContent).toContain('DEL2');
  });

  it('filters queue by search query (code, customer name, area)', async () => {
    const { fixture } = await createFixture([
      INITIAL_ORDER_TAKEAWAY,
      INITIAL_ORDER_DELIVERY_UNASSIGNED,
    ]);
    const searchInput = fixture.nativeElement.querySelector('.search-input') as HTMLInputElement;

    searchInput.value = 'Sara';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sara Ali');
    expect(fixture.nativeElement.textContent).not.toContain('Ahmed Mahmoud');

    const clearButton = fixture.nativeElement.querySelector(
      '.clear-search-btn',
    ) as HTMLButtonElement;
    expect(clearButton).toBeTruthy();
    clearButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ahmed Mahmoud');
    expect(fixture.nativeElement.textContent).toContain('Sara Ali');
  });

  it('toggles item details via progressive disclosure', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY]);
    expect(fixture.nativeElement.querySelector('.order-ticket__details')).toBeFalsy();

    const toggleBtn = fixture.nativeElement.querySelector(
      '.details-toggle-btn',
    ) as HTMLButtonElement;
    toggleBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.order-ticket__details')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('مشاوي مشكل');
    expect(fixture.nativeElement.textContent).toContain('بدون شطة');

    toggleBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.order-ticket__details')).toBeFalsy();
  });

  it('toggles all items details via expand/collapse all toolbar button', async () => {
    const { fixture } = await createFixture([
      INITIAL_ORDER_TAKEAWAY,
      INITIAL_ORDER_DELIVERY_UNASSIGNED,
    ]);
    expect(fixture.nativeElement.querySelectorAll('.order-ticket__details').length).toBe(0);

    const toggleAllBtn = fixture.nativeElement.querySelector(
      '.action-toggle-btn',
    ) as HTMLButtonElement;
    toggleAllBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.order-ticket__details').length).toBe(2);

    toggleAllBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.order-ticket__details').length).toBe(0);
  });

  it('displays elapsed time badges with long-wait styling when applicable', async () => {
    const { fixture } = await createFixture([
      INITIAL_ORDER_TAKEAWAY,
      INITIAL_ORDER_DELIVERY_UNASSIGNED,
    ]);
    const agingBadges = fixture.nativeElement.querySelectorAll('.aging-badge');

    // Index 0: INITIAL_ORDER_DELIVERY_UNASSIGNED (25m -> long-wait)
    // Index 1: INITIAL_ORDER_TAKEAWAY (5m)
    expect(agingBadges[0]?.classList.contains('aging-badge--long-wait')).toBe(true);
    expect(agingBadges[1]?.classList.contains('aging-badge--long-wait')).toBe(false);
    expect(agingBadges[0]?.textContent).toContain('25');
    expect(agingBadges[1]?.textContent).toContain('5');
  });

  it('initiates takeaway handoff, confirms successfully, and removes order', async () => {
    let completedArgs: { id: string; rowVersion: string } | undefined;
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY], MOCK_DRIVERS, {
      completeCashTakeaway: (id, rowVersion) => {
        completedArgs = { id, rowVersion };
        return of('success');
      },
    });

    const handoffBtn = fixture.nativeElement.querySelector('.handoff-button') as HTMLButtonElement;
    handoffBtn.click();
    fixture.detectChanges();

    const confirmBox = fixture.nativeElement.querySelector('.handoff-confirm');
    expect(confirmBox).toBeTruthy();

    const confirmBtn = confirmBox.querySelector('.btn-confirm') as HTMLButtonElement;
    confirmBtn.click();
    fixture.detectChanges();

    expect(completedArgs).toEqual({ id: '1', rowVersion: 'v1' });
    expect(fixture.nativeElement.textContent).not.toContain('TAKE1');
  });

  it('allows canceling takeaway handoff without calling API', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY]);
    const handoffBtn = fixture.nativeElement.querySelector('.handoff-button') as HTMLButtonElement;
    handoffBtn.click();
    fixture.detectChanges();

    const cancelBtn = fixture.nativeElement.querySelector('.btn-cancel') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.handoff-confirm')).toBeFalsy();
    expect(fixture.nativeElement.textContent).toContain('TAKE1');
  });

  it('handles 409 stale data error gracefully with warning message', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY], MOCK_DRIVERS, {
      completeCashTakeaway: () => of('stale'),
    });
    const handoffBtn = fixture.nativeElement.querySelector('.handoff-button') as HTMLButtonElement;
    handoffBtn.click();
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector('.btn-confirm') as HTMLButtonElement;
    confirmBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.error-badge--stale')).toBeTruthy();
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

  it('switches language and reflects translated copy', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY]);
    const langBtns = fixture.nativeElement.querySelectorAll(
      '.language-switcher button',
    ) as NodeListOf<HTMLButtonElement>;

    // Click English
    langBtns[1]?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cashier');
    expect(fixture.nativeElement.textContent).toContain('Ready for Pickup');

    // Switch back to Arabic
    langBtns[0]?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('الكاشير');
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
          useValue: {
            getSession: () => of({ isAuthenticated: true }),
            getCashierSession: () => of({ isAuthenticated: true }),
            signOut: () => of(undefined),
            signOutCashier: () => of(undefined),
          },
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
