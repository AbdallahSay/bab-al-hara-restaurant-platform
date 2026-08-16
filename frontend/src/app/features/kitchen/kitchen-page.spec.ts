import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import {
  Category,
  KitchenOrder,
  MenuItem,
  MenuItemAvailabilityChangedEvent,
  OrderStatusChangedEvent,
} from '../customer-ordering/order.models';
import { KitchenApiService } from './kitchen-api.service';
import { KitchenPage } from './kitchen-page';
import { KitchenRealtimeService } from './kitchen-realtime.service';
import { StaffSessionService } from './staff-session.service';

const INITIAL_ORDER_PENDING: KitchenOrder = {
  publicCode: 'BH-PENDING',
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

const INITIAL_ORDER_PREPARING: KitchenOrder = {
  publicCode: 'BH-PREP',
  createdAt: '2026-08-13T18:05:00Z',
  orderType: 'Delivery',
  status: 'Preparing',
  customerName: 'Mahmoud',
  deliveryAreaNameAr: 'مدينة نصر',
  deliveryAreaNameEn: 'Nasr City',
  address: 'شارع عباس العقاد',
  customerNote: null,
  items: [{ productNameAr: 'شاورما لحم', productNameEn: 'Beef Shawarma', quantity: 1 }],
};

const SAMPLE_CATEGORY: Category = {
  id: 'cat-1',
  nameAr: 'مشاوي',
  nameEn: 'Grills',
  displayOrder: 1,
};

const SAMPLE_MENU_ITEM: MenuItem = {
  id: 'item-1',
  categoryId: 'cat-1',
  nameAr: 'شيش طاووق',
  nameEn: 'Shish Tawook',
  descriptionAr: 'دجاج متبل على الفحم',
  descriptionEn: 'Grilled chicken skewers',
  price: 120,
  imageReference: 'shish.jpg',
  preparationMinutes: 15,
  isAvailable: true,
};

describe('KitchenPage', () => {
  it('renders the persisted initial queue and displays order details', async () => {
    const { fixture } = await createFixture([INITIAL_ORDER_PENDING]);

    expect(fixture.nativeElement.textContent).toContain('BH-PENDING');
    expect(fixture.nativeElement.textContent).toContain('2×');
    expect(fixture.nativeElement.textContent).toContain('بدون بصل');
    expect(fixture.nativeElement.textContent).toContain('Ahmed');
  });

  it('filters orders by status tab and search query', async () => {
    const { fixture, component } = await createFixture([
      INITIAL_ORDER_PENDING,
      INITIAL_ORDER_PREPARING,
    ]);

    expect(component['filteredOrders']().length).toBe(2);

    component['setFilter']('Pending');
    fixture.detectChanges();
    expect(component['filteredOrders']().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('BH-PENDING');
    expect(fixture.nativeElement.textContent).not.toContain('BH-PREP');

    component['setFilter']('ALL');
    component['searchQuery'].set('Mahmoud');
    fixture.detectChanges();
    expect(component['filteredOrders']().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('BH-PREP');
  });

  it('advances order status from Pending to Confirmed and prevents duplicate clicks', async () => {
    let confirmCalledWith = '';
    const confirmSubject = new Subject<KitchenOrder>();

    const { fixture, component } = await createFixture([INITIAL_ORDER_PENDING], {
      confirmOrder: (code: string) => {
        confirmCalledWith = code;
        return confirmSubject.asObservable();
      },
    });

    const actionButton = fixture.nativeElement.querySelector(
      '.action-button--confirm',
    ) as HTMLButtonElement;
    expect(actionButton).toBeTruthy();

    actionButton.click();
    fixture.detectChanges();

    expect(confirmCalledWith).toBe('BH-PENDING');
    expect(component['isSubmitting']('BH-PENDING')).toBe(true);
    expect(actionButton.disabled).toBe(true);

    // Clicking again while in flight should be ignored
    actionButton.click();
    expect(confirmCalledWith).toBe('BH-PENDING');

    confirmSubject.next({ ...INITIAL_ORDER_PENDING, status: 'Confirmed' });
    confirmSubject.complete();
    fixture.detectChanges();

    expect(component['isSubmitting']('BH-PENDING')).toBe(false);
    expect(component['orders']()[0]?.status).toBe('Confirmed');
  });

  it('verifies Pending orders cannot offer Start Preparing and Confirmed orders advance to Preparing', async () => {
    let prepareCalledWith = '';
    const initialConfirmedOrder: KitchenOrder = {
      ...INITIAL_ORDER_PENDING,
      status: 'Confirmed',
    };

    const { fixture, component } = await createFixture([initialConfirmedOrder], {
      startPreparing: (code: string) => {
        prepareCalledWith = code;
        return of({ ...initialConfirmedOrder, status: 'Preparing' });
      },
    });

    expect(fixture.nativeElement.querySelector('.action-button--confirm')).toBeNull();
    const prepareButton = fixture.nativeElement.querySelector(
      '.action-button--prepare',
    ) as HTMLButtonElement;
    expect(prepareButton).toBeTruthy();

    prepareButton.click();
    fixture.detectChanges();

    expect(prepareCalledWith).toBe('BH-PENDING');
    expect(component['orders']()[0]?.status).toBe('Preparing');
  });

  it('advances order from Preparing to Ready', async () => {
    let readyCalledWith = '';
    const { fixture, component } = await createFixture([INITIAL_ORDER_PREPARING], {
      markReady: (code: string) => {
        readyCalledWith = code;
        return of({ ...INITIAL_ORDER_PREPARING, status: 'Ready' });
      },
    });

    const readyButton = fixture.nativeElement.querySelector(
      '.action-button--ready',
    ) as HTMLButtonElement;
    expect(readyButton).toBeTruthy();

    readyButton.click();
    fixture.detectChanges();

    expect(readyCalledWith).toBe('BH-PREP');
    expect(component['orders']()[0]?.status).toBe('Ready');
  });

  it('handles 409 Conflict gracefully by notifying staff and refreshing queue', async () => {
    let getActiveOrdersCalls = 0;
    const { fixture, component } = await createFixture([INITIAL_ORDER_PENDING], {
      confirmOrder: () => throwError(() => ({ status: 409 })),
      getActiveOrders: () => {
        getActiveOrdersCalls++;
        if (getActiveOrdersCalls > 1) {
          return of([{ ...INITIAL_ORDER_PENDING, status: 'Confirmed' }]);
        }
        return of([INITIAL_ORDER_PENDING]);
      },
    });

    const actionButton = fixture.nativeElement.querySelector(
      '.action-button--confirm',
    ) as HTMLButtonElement;
    expect(actionButton).toBeTruthy();

    actionButton.click();
    fixture.detectChanges();

    expect(component['toastMessage']()).toContain('تم تحديث هذا الطلب');
    expect(component['isSubmitting']('BH-PENDING')).toBe(false);
    expect(getActiveOrdersCalls).toBeGreaterThanOrEqual(2);
  });

  it('upserts a realtime order and shows a high-visibility alert', async () => {
    const { fixture, newOrders } = await createFixture([]);

    newOrders.next({ ...INITIAL_ORDER_PENDING, publicCode: 'BH-LIVE' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.new-order-banner').textContent).toContain(
      'BH-LIVE',
    );
    expect(fixture.nativeElement.querySelector('.order-ticket').textContent).toContain('BH-LIVE');
  });

  it('handles OrderStatusChanged realtime event', async () => {
    const { fixture, component, statusChanged } = await createFixture([INITIAL_ORDER_PENDING]);

    statusChanged.next({ publicCode: 'BH-PENDING', status: 'Preparing' });
    fixture.detectChanges();

    expect(component['orders']()[0]?.status).toBe('Preparing');
  });

  it('handles MenuItemAvailabilityChanged realtime event', async () => {
    const { fixture, component, availabilityChanged } = await createFixture(
      [INITIAL_ORDER_PENDING],
      {
        getMenuItems: () => of([SAMPLE_MENU_ITEM]),
      },
    );

    component['openAvailabilityModal']();
    fixture.detectChanges();

    expect(component['menuItems']()[0]?.isAvailable).toBe(true);

    availabilityChanged.next({ menuItemId: 'item-1', isAvailable: false });
    fixture.detectChanges();

    expect(component['menuItems']()[0]?.isAvailable).toBe(false);
  });

  it('manages menu item availability with confirmation dialog', async () => {
    let updatedId = '';
    let updatedState: boolean | undefined;

    const { fixture, component } = await createFixture([], {
      getCategories: () => of([SAMPLE_CATEGORY]),
      getMenuItems: () => of([SAMPLE_MENU_ITEM]),
      updateMenuItemAvailability: (id: string, isAvailable: boolean) => {
        updatedId = id;
        updatedState = isAvailable;
        return of({ id, isAvailable });
      },
    });

    component['openAvailabilityModal']();
    fixture.detectChanges();

    expect(component['isAvailabilityModalOpen']()).toBe(true);

    // Request toggle
    component['requestToggleAvailability'](SAMPLE_MENU_ITEM);
    fixture.detectChanges();

    expect(component['pendingAvailabilityToggle']()).toEqual({
      item: SAMPLE_MENU_ITEM,
      nextStatus: false,
    });
    expect(fixture.nativeElement.querySelector('.modal-card--confirm')).toBeTruthy();

    // Confirm toggle
    component['confirmToggleAvailability']();
    fixture.detectChanges();

    expect(updatedId).toBe('item-1');
    expect(updatedState).toBe(false);
    expect(component['pendingAvailabilityToggle']()).toBeNull();
    expect(component['menuItems']()[0]?.isAvailable).toBe(false);
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
          useValue: { getSession: () => of({ isAuthenticated: true, displayName: 'Chef Ali' }) },
        },
        {
          provide: KitchenApiService,
          useValue: {
            getActiveOrders: () => {
              calls += 1;
              return of([]);
            },
            getCategories: () => of([]),
            getMenuItems: () => of([]),
          },
        },
        {
          provide: KitchenRealtimeService,
          useValue: {
            status: () => 'connected',
            newOrders$: new Subject<KitchenOrder>(),
            statusChanged$: new Subject<OrderStatusChangedEvent>(),
            availabilityChanged$: new Subject<MenuItemAvailabilityChangedEvent>(),
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

  async function createFixture(
    orders: readonly KitchenOrder[],
    apiOverrides: Partial<Record<keyof KitchenApiService, unknown>> = {},
  ) {
    const newOrders = new Subject<KitchenOrder>();
    const statusChanged = new Subject<OrderStatusChangedEvent>();
    const availabilityChanged = new Subject<MenuItemAvailabilityChangedEvent>();
    const reconnected = new Subject<void>();

    const defaultApi = {
      getActiveOrders: () => of(orders),
      confirmOrder: (code: string) =>
        of({ ...INITIAL_ORDER_PENDING, publicCode: code, status: 'Confirmed' as const }),
      startPreparing: (code: string) =>
        of({ ...INITIAL_ORDER_PENDING, publicCode: code, status: 'Preparing' as const }),
      markReady: (code: string) =>
        of({ ...INITIAL_ORDER_PENDING, publicCode: code, status: 'Ready' as const }),
      getCategories: () => of([SAMPLE_CATEGORY]),
      getMenuItems: () => of([SAMPLE_MENU_ITEM]),
      updateMenuItemAvailability: (id: string, isAvailable: boolean) => of({ id, isAvailable }),
      ...apiOverrides,
    };

    await TestBed.configureTestingModule({
      imports: [KitchenPage],
      providers: [
        provideRouter([]),
        {
          provide: StaffSessionService,
          useValue: { getSession: () => of({ isAuthenticated: true, displayName: 'Chef' }) },
        },
        { provide: KitchenApiService, useValue: defaultApi },
        {
          provide: KitchenRealtimeService,
          useValue: {
            status: () => 'connected',
            newOrders$: newOrders,
            statusChanged$: statusChanged,
            availabilityChanged$: availabilityChanged,
            reconnected$: reconnected,
            start: () => Promise.resolve(),
            stop: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(KitchenPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    return { fixture, component, newOrders, statusChanged, availabilityChanged, reconnected };
  }
});
