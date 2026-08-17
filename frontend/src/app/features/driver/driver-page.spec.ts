import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { OrderStatusChangedEvent } from '../customer-ordering/order.models';
import { StaffSessionService } from '../kitchen/staff-session.service';
import { DriverApiService } from './driver-api.service';
import { DriverHubService } from './driver-hub.service';
import { DriverPage } from './driver-page';
import { DriverOrderDto } from './driver.models';

const SAMPLE_READY_ORDER: DriverOrderDto = {
  publicCode: 'BH-DRV-1',
  createdAt: '2026-08-17T01:00:00Z',
  orderType: 'Delivery',
  status: 'Ready',
  customerName: 'Youssef Mansour',
  customerPhone: '01011112222',
  deliveryAreaNameAr: 'الدقي',
  deliveryAreaNameEn: 'Dokki',
  address: '10 Mosaddak St, Floor 4, Apt 8',
  customerNote: 'يرجى الاتصال عند الوصول',
  subtotal: 180,
  deliveryFee: 20,
  total: 200,
  paymentMethod: 'Cash',
  paymentStatus: 'Pending',
  rowVersion: 'AAAAAAAAB+E=',
  items: [{ productNameAr: 'سندوتش شيش طاووق', productNameEn: 'Shish sandwich', quantity: 2 }],
};

const SAMPLE_ONTHEWAY_ORDER: DriverOrderDto = {
  publicCode: 'BH-DRV-2',
  createdAt: '2026-08-17T01:05:00Z',
  orderType: 'Delivery',
  status: 'OnTheWay',
  customerName: 'Kareem Tarek',
  customerPhone: '01099998888',
  deliveryAreaNameAr: 'المهندسين',
  deliveryAreaNameEn: 'Mohandessin',
  address: '25 Gameat El Dowal St',
  customerNote: null,
  subtotal: 350,
  deliveryFee: 25,
  total: 375,
  paymentMethod: 'Cash',
  paymentStatus: 'Pending',
  rowVersion: 'AAAAAAAAB+F=',
  items: [{ productNameAr: 'دجاج مشوي على الفحم', productNameEn: 'Grilled Chicken', quantity: 1 }],
};

const SAMPLE_DELIVERED_ORDER: DriverOrderDto = {
  publicCode: 'BH-DRV-3',
  createdAt: '2026-08-17T00:30:00Z',
  orderType: 'Delivery',
  status: 'Delivered',
  customerName: 'Hany Samir',
  customerPhone: '01055554444',
  deliveryAreaNameAr: 'الدقي',
  deliveryAreaNameEn: 'Dokki',
  address: '5 Tahrir St',
  customerNote: null,
  subtotal: 120,
  deliveryFee: 20,
  total: 140,
  paymentMethod: 'Cash',
  paymentStatus: 'Paid',
  rowVersion: 'AAAAAAAAB+G=',
  items: [{ productNameAr: 'حمص', productNameEn: 'Hummus', quantity: 1 }],
};

describe('DriverPage', () => {
  it('renders the assigned orders list and displays delivery details', async () => {
    const { fixture } = await createFixture([SAMPLE_READY_ORDER]);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('BH-DRV-1');
    expect(text).toContain('Youssef Mansour');
    expect(text).toContain('01011112222');
    expect(text).toContain('10 Mosaddak St');
    expect(text).toContain('يرجى الاتصال عند الوصول');
    expect(text).toContain('200.00');
    expect(text).toContain('2×');
  });

  it('filters assigned orders by tab and search query', async () => {
    const { fixture, component } = await createFixture([
      SAMPLE_READY_ORDER,
      SAMPLE_ONTHEWAY_ORDER,
      SAMPLE_DELIVERED_ORDER,
    ]);

    expect(component['filteredOrders']().length).toBe(3);

    // Filter Ready
    component['setFilter']('Ready');
    fixture.detectChanges();
    expect(component['filteredOrders']().length).toBe(1);
    expect(component['filteredOrders']()[0]?.publicCode).toBe('BH-DRV-1');

    // Filter OnTheWay
    component['setFilter']('OnTheWay');
    fixture.detectChanges();
    expect(component['filteredOrders']().length).toBe(1);
    expect(component['filteredOrders']()[0]?.publicCode).toBe('BH-DRV-2');

    // Filter Delivered
    component['setFilter']('Delivered');
    fixture.detectChanges();
    expect(component['filteredOrders']().length).toBe(1);
    expect(component['filteredOrders']()[0]?.publicCode).toBe('BH-DRV-3');

    // Search query
    component['setFilter']('ALL');
    component['searchQuery'].set('Kareem');
    fixture.detectChanges();
    expect(component['filteredOrders']().length).toBe(1);
    expect(component['filteredOrders']()[0]?.customerName).toBe('Kareem Tarek');
  });

  it('prompts confirmation modal and starts delivery for Ready orders', async () => {
    let startDeliveryCalledWith: { id: string; rowVersion: string } | null = null;
    const startSubject = new Subject<{ isSuccess: boolean; order?: DriverOrderDto }>();

    const { fixture, component } = await createFixture([SAMPLE_READY_ORDER], {
      startDelivery: (id: string, rowVersion: string) => {
        startDeliveryCalledWith = { id, rowVersion };
        return startSubject.asObservable();
      },
    });

    const startButton = fixture.nativeElement.querySelector(
      '.action-button--start',
    ) as HTMLButtonElement;
    expect(startButton).toBeTruthy();

    // Click action button opens confirmation modal
    startButton.click();
    fixture.detectChanges();

    expect(component['pendingConfirmation']()).toEqual({
      order: SAMPLE_READY_ORDER,
      actionType: 'startDelivery',
    });
    expect(fixture.nativeElement.querySelector('.modal-backdrop')).toBeTruthy();

    // Click confirm inside modal
    const confirmModalBtn = fixture.nativeElement.querySelector(
      '.modal-btn--confirm',
    ) as HTMLButtonElement;
    confirmModalBtn.click();
    fixture.detectChanges();

    expect(startDeliveryCalledWith).toEqual({ id: 'BH-DRV-1', rowVersion: 'AAAAAAAAB+E=' });
    expect(component['isSubmitting']('BH-DRV-1')).toBe(true);

    startSubject.next({
      isSuccess: true,
      order: { ...SAMPLE_READY_ORDER, status: 'OnTheWay' },
    });
    startSubject.complete();
    fixture.detectChanges();

    expect(component['isSubmitting']('BH-DRV-1')).toBe(false);
    expect(component['orders']()[0]?.status).toBe('OnTheWay');
  });

  it('prompts confirmation modal and marks order as delivered for OnTheWay orders', async () => {
    let markDeliveredCalledWith: { id: string; rowVersion: string } | null = null;

    const { fixture, component } = await createFixture([SAMPLE_ONTHEWAY_ORDER], {
      markDelivered: (id: string, rowVersion: string) => {
        markDeliveredCalledWith = { id, rowVersion };
        return of({
          isSuccess: true,
          order: { ...SAMPLE_ONTHEWAY_ORDER, status: 'Delivered', paymentStatus: 'Paid' },
        });
      },
    });

    const deliveredButton = fixture.nativeElement.querySelector(
      '.action-button--delivered',
    ) as HTMLButtonElement;
    expect(deliveredButton).toBeTruthy();

    // Click to open confirmation modal
    deliveredButton.click();
    fixture.detectChanges();

    expect(component['pendingConfirmation']()?.actionType).toBe('markDelivered');

    // Confirm in modal
    const confirmModalBtn = fixture.nativeElement.querySelector(
      '.modal-btn--confirm',
    ) as HTMLButtonElement;
    confirmModalBtn.click();
    fixture.detectChanges();

    expect(markDeliveredCalledWith).toEqual({ id: 'BH-DRV-2', rowVersion: 'AAAAAAAAB+F=' });
    expect(component['orders']()[0]?.status).toBe('Delivered');
  });

  it('handles 409 Conflict gracefully by notifying driver and reloading orders', async () => {
    let getAssignedCalls = 0;
    const { fixture, component } = await createFixture([SAMPLE_READY_ORDER], {
      startDelivery: () => throwError(() => ({ status: 409 })),
      getAssignedOrders: () => {
        getAssignedCalls++;
        if (getAssignedCalls > 1) {
          return of([{ ...SAMPLE_READY_ORDER, status: 'OnTheWay' }]);
        }
        return of([SAMPLE_READY_ORDER]);
      },
    });

    const startButton = fixture.nativeElement.querySelector(
      '.action-button--start',
    ) as HTMLButtonElement;
    startButton.click();
    fixture.detectChanges();

    const confirmModalBtn = fixture.nativeElement.querySelector(
      '.modal-btn--confirm',
    ) as HTMLButtonElement;
    confirmModalBtn.click();
    fixture.detectChanges();

    expect(component['toastMessage']()).toContain('تم تحديث حالة هذا الطلب');
    expect(component['isSubmitting']('BH-DRV-1')).toBe(false);
    expect(getAssignedCalls).toBeGreaterThanOrEqual(2);
  });

  it('handles OrderAssigned realtime event and shows new assignment banner', async () => {
    const { fixture, component, orderAssigned } = await createFixture([]);

    const incomingOrder: DriverOrderDto = {
      ...SAMPLE_READY_ORDER,
      publicCode: 'BH-REALTIME-99',
    };

    orderAssigned.next(incomingOrder);
    fixture.detectChanges();

    expect(component['orders']().length).toBe(1);
    expect(component['newAssignmentCode']()).toBe('BH-REALTIME-99');
    expect(fixture.nativeElement.querySelector('.new-assignment-banner')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('BH-REALTIME-99');
  });

  it('handles OrderStatusChanged realtime event', async () => {
    const { fixture, component, statusChanged } = await createFixture([SAMPLE_READY_ORDER]);

    statusChanged.next({ publicCode: 'BH-DRV-1', status: 'Delivered' });
    fixture.detectChanges();

    expect(component['orders']()[0]?.status).toBe('Delivered');
  });

  it('re-fetches assigned orders on SignalR reconnect', async () => {
    let calls = 0;
    const reconnected = new Subject<void>();

    await TestBed.configureTestingModule({
      imports: [DriverPage],
      providers: [
        provideRouter([]),
        {
          provide: StaffSessionService,
          useValue: { getSession: () => of({ isAuthenticated: true, displayName: 'Driver Ali' }) },
        },
        {
          provide: DriverApiService,
          useValue: {
            getAssignedOrders: () => {
              calls++;
              return of([]);
            },
          },
        },
        {
          provide: DriverHubService,
          useValue: {
            status: () => 'connected',
            orderAssigned$: new Subject<DriverOrderDto>(),
            orderStatusChanged$: new Subject<OrderStatusChangedEvent>(),
            reconnected$: reconnected,
            start: () => Promise.resolve(),
            stop: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DriverPage);
    fixture.detectChanges();
    expect(calls).toBe(1);

    reconnected.next();
    fixture.detectChanges();
    expect(calls).toBe(2);
  });

  async function createFixture(
    orders: readonly DriverOrderDto[],
    apiOverrides: Partial<Record<keyof DriverApiService, unknown>> = {},
  ) {
    const orderAssigned = new Subject<DriverOrderDto>();
    const statusChanged = new Subject<OrderStatusChangedEvent>();
    const reconnected = new Subject<void>();

    const defaultApi = {
      getAssignedOrders: () => of([...orders]),
      startDelivery: () => of({ isSuccess: true }),
      markDelivered: () => of({ isSuccess: true }),
      ...apiOverrides,
    };

    await TestBed.configureTestingModule({
      imports: [DriverPage],
      providers: [
        provideRouter([]),
        {
          provide: StaffSessionService,
          useValue: {
            getSession: () => of({ isAuthenticated: true, displayName: 'Driver Ali' }),
            signOut: () => of(undefined),
          },
        },
        { provide: DriverApiService, useValue: defaultApi },
        {
          provide: DriverHubService,
          useValue: {
            status: () => 'connected',
            orderAssigned$: orderAssigned,
            orderStatusChanged$: statusChanged,
            reconnected$: reconnected,
            start: () => Promise.resolve(),
            stop: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DriverPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    return { fixture, component, orderAssigned, statusChanged, reconnected };
  }
});
