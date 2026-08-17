import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { vi } from 'vitest';

import { CashierOrderDto } from './cashier.models';
import { CashierApiService, HandoffResult } from './cashier-api.service';
import { CashierPage } from './cashier-page';
import { CashierHubService } from './cashier-hub.service';
import { StaffSessionService } from '../kitchen/staff-session.service';

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
  customerNote: 'Without spicy sauce',
  subtotal: 100,
  deliveryFee: 0,
  total: 100,
  paymentMethod: 'Cash',
  paymentStatus: 'Pending',
  rowVersion: 'v1',
  items: [
    { productNameAr: 'مشاوي مشكل', productNameEn: 'Mixed Grill', quantity: 2 },
    { productNameAr: 'حمص شام', productNameEn: 'Hummus', quantity: 1 },
  ],
};

const INITIAL_ORDER_DELIVERY: CashierOrderDto = {
  ...INITIAL_ORDER_TAKEAWAY,
  id: '2',
  publicCode: 'DEL2',
  createdAt: new Date(Date.now() - 25 * 60_000).toISOString(),
  orderType: 'Delivery',
  customerName: 'Sara Ali',
  deliveryAreaNameEn: 'Nasr City',
  deliveryAreaNameAr: 'مدينة نصر',
  address: '12 Abbas El Akkad, Floor 4, Apt 12',
  subtotal: 250,
  deliveryFee: 30,
  total: 280,
  paymentStatus: 'Pending',
  items: [{ productNameAr: 'كفتة مشوية', productNameEn: 'Kofta Grill', quantity: 3 }],
};

describe('CashierPage', () => {
  it('renders order list on load with public codes, customers, and totals', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY, INITIAL_ORDER_DELIVERY]);
    expect(fixture.nativeElement.textContent).toContain('TAKE1');
    expect(fixture.nativeElement.textContent).toContain('DEL2');
    expect(fixture.nativeElement.textContent).toContain('Ahmed Mahmoud');
    expect(fixture.nativeElement.textContent).toContain('Sara Ali');
    expect(fixture.nativeElement.textContent).toContain('100');
    expect(fixture.nativeElement.textContent).toContain('280');
  });

  it('shows Delivery orders with waiting-for-driver status and area (no handoff button)', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_DELIVERY]);
    expect(fixture.nativeElement.textContent).toContain('بانتظار السائق');
    expect(fixture.nativeElement.textContent).toContain('مدينة نصر');
    expect(fixture.nativeElement.querySelector('.handoff-button')).toBeFalsy();
  });

  it('shows Takeaway orders with handoff button and collection amount', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY]);
    expect(fixture.nativeElement.querySelector('.handoff-button')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('تحصيل');
    expect(fixture.nativeElement.textContent).toContain('100');
  });

  it('filters queue by operational type (Takeaway vs Delivery)', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY, INITIAL_ORDER_DELIVERY]);
    const filterTabs = fixture.nativeElement.querySelectorAll(
      '.filter-tab',
    ) as NodeListOf<HTMLButtonElement>;

    // Click Takeaway filter
    filterTabs[1]?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('TAKE1');
    expect(fixture.nativeElement.textContent).not.toContain('DEL2');

    // Click Delivery filter
    filterTabs[2]?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('TAKE1');
    expect(fixture.nativeElement.textContent).toContain('DEL2');

    // Click All filter
    filterTabs[0]?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('TAKE1');
    expect(fixture.nativeElement.textContent).toContain('DEL2');
  });

  it('filters queue by search query (code, customer name, area)', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY, INITIAL_ORDER_DELIVERY]);
    const searchInput = fixture.nativeElement.querySelector(
      '.search-box input',
    ) as HTMLInputElement;

    searchInput.value = 'Sara';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sara Ali');
    expect(fixture.nativeElement.textContent).not.toContain('Ahmed Mahmoud');

    const clearButton = fixture.nativeElement.querySelector(
      '.clear-search-button',
    ) as HTMLButtonElement;
    expect(clearButton).toBeTruthy();
    clearButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ahmed Mahmoud');
    expect(fixture.nativeElement.textContent).toContain('Sara Ali');
  });

  it('toggles item details via progressive disclosure', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY]);
    // Details initially hidden
    expect(fixture.nativeElement.querySelector('.order-ticket__details')).toBeFalsy();

    // Toggle details button
    const toggleBtn = fixture.nativeElement.querySelector(
      '.details-toggle-btn',
    ) as HTMLButtonElement;
    toggleBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.order-ticket__details')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('مشاوي مشكل');
    expect(fixture.nativeElement.textContent).toContain('Without spicy sauce');

    // Toggle again to collapse
    toggleBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.order-ticket__details')).toBeFalsy();
  });

  it('toggles all items details via expand/collapse all toolbar button', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY, INITIAL_ORDER_DELIVERY]);
    expect(fixture.nativeElement.querySelectorAll('.order-ticket__details').length).toBe(0);

    const toggleAllBtn = fixture.nativeElement.querySelector(
      '.toggle-all-button',
    ) as HTMLButtonElement;
    toggleAllBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.order-ticket__details').length).toBe(2);

    toggleAllBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.order-ticket__details').length).toBe(0);
  });

  it('displays aging badges with appropriate urgency styling', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY, INITIAL_ORDER_DELIVERY]);
    const agingBadges = fixture.nativeElement.querySelectorAll('.time-aging-badge');

    // filteredOrders sorts oldest first:
    // Index 0: INITIAL_ORDER_DELIVERY (25m old -> overdue)
    // Index 1: INITIAL_ORDER_TAKEAWAY (5m old -> normal)
    expect(agingBadges[0]?.classList.contains('aging-badge--overdue')).toBe(true);
    expect(agingBadges[1]?.classList.contains('aging-badge--normal')).toBe(true);
  });

  it('initiates takeaway handoff, confirms successfully, and removes order', async () => {
    const { fixture, apiSpy } = await createFixture([INITIAL_ORDER_TAKEAWAY]);
    const handoffBtn = fixture.nativeElement.querySelector('.handoff-button') as HTMLButtonElement;
    handoffBtn.click();
    fixture.detectChanges();

    // Confirmation dialog appears
    const confirmBox = fixture.nativeElement.querySelector('.handoff-confirm');
    expect(confirmBox).toBeTruthy();

    const confirmBtn = confirmBox.querySelector('.btn-confirm') as HTMLButtonElement;
    confirmBtn.click();
    fixture.detectChanges();

    expect(apiSpy.completeCashTakeaway).toHaveBeenCalledWith('1', 'v1');
    expect(fixture.nativeElement.textContent).not.toContain('TAKE1');
  });

  it('allows canceling takeaway handoff without calling API', async () => {
    const { fixture, apiSpy } = await createFixture([INITIAL_ORDER_TAKEAWAY]);
    const handoffBtn = fixture.nativeElement.querySelector('.handoff-button') as HTMLButtonElement;
    handoffBtn.click();
    fixture.detectChanges();

    const cancelBtn = fixture.nativeElement.querySelector('.btn-cancel') as HTMLButtonElement;
    cancelBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.handoff-confirm')).toBeFalsy();
    expect(apiSpy.completeCashTakeaway).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('TAKE1');
  });

  it('handles 409 stale data error gracefully with warning message', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY], 'stale');
    const handoffBtn = fixture.nativeElement.querySelector('.handoff-button') as HTMLButtonElement;
    handoffBtn.click();
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector('.btn-confirm') as HTMLButtonElement;
    confirmBtn.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.error-badge--stale')).toBeTruthy();
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

  it('switches language and reflects translated copy', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_TAKEAWAY]);
    const langBtns = fixture.nativeElement.querySelectorAll(
      '.language-switcher button',
    ) as NodeListOf<HTMLButtonElement>;

    // Click English
    langBtns[1]?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cashier');
    expect(fixture.nativeElement.textContent).toContain('Ready orders');

    // Switch back to Arabic
    langBtns[0]?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('الكاشير');
  });

  async function createFixture(
    orders: readonly CashierOrderDto[],
    handoffResult: HandoffResult = 'success',
  ) {
    const orderCompleted = new Subject<string>();
    const apiSpy = {
      getReadyOrders: vi.fn(() => of(orders)),
      completeCashTakeaway: vi.fn(() => of(handoffResult)),
    };

    await TestBed.configureTestingModule({
      imports: [CashierPage],
      providers: [
        provideRouter([]),
        {
          provide: StaffSessionService,
          useValue: {
            getSession: () => of({ isAuthenticated: true }),
            signOut: () => of(undefined),
          },
        },
        {
          provide: CashierApiService,
          useValue: apiSpy,
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
    return { fixture, orderCompleted, apiSpy };
  }
});
