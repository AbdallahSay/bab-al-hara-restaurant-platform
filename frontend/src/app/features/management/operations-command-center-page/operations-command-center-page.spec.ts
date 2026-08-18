import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StaffSessionService } from '../../kitchen/staff-session.service';
import { ManagementApiService } from '../management-api.service';
import {
  OperationsActiveOrderDto,
  OperationsAttentionItemDto,
  OperationsCommandCenterResponse,
  OperationsSummaryDto,
} from '../management.models';
import {
  OperationsDriverAssignedEvent,
  OperationsOrderStatusChangedEvent,
  OperationsRealtimeService,
} from '../operations-realtime.service';
import { OperationsCommandCenterPage } from './operations-command-center-page';

describe('OperationsCommandCenterPage', () => {
  let component: OperationsCommandCenterPage;
  let fixture: ComponentFixture<OperationsCommandCenterPage>;

  let apiMock: {
    getOperationsSnapshot: ReturnType<typeof vi.fn>;
  };
  let sessionMock: {
    signOutManagement: ReturnType<typeof vi.fn>;
  };
  let realtimeMock: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
    operationsUpdated$: Subject<void>;
    orderCreated$: Subject<string>;
    orderStatusChanged$: Subject<OperationsOrderStatusChangedEvent>;
    driverAssigned$: Subject<OperationsDriverAssignedEvent>;
    reconnected$: Subject<void>;
  };

  const MOCK_SUMMARY: OperationsSummaryDto = {
    activeOrders: 3,
    pending: 1,
    confirmed: 0,
    preparing: 1,
    ready: 1,
    onTheWay: 0,
    deliveryWaitingForDriver: 1,
  };

  const MOCK_ATTENTION: OperationsAttentionItemDto[] = [
    {
      orderId: 'order-1',
      publicCode: 'BH-PND-001',
      createdAtUtc: new Date(Date.now() - 10 * 60_000).toISOString(),
      currentStatusSinceUtc: new Date(Date.now() - 10 * 60_000).toISOString(),
      orderType: 'Takeaway',
      status: 'Pending',
      reasonCode: 'unacknowledged_pending',
      customerName: 'Customer Pending',
      total: 150,
    },
    {
      orderId: 'order-3',
      publicCode: 'BH-RDY-003',
      createdAtUtc: new Date(Date.now() - 25 * 60_000).toISOString(),
      currentStatusSinceUtc: new Date(Date.now() - 5 * 60_000).toISOString(),
      orderType: 'Delivery',
      status: 'Ready',
      reasonCode: 'unassigned_ready_delivery',
      customerName: 'Customer Ready Delivery',
      total: 300,
    },
  ];

  const MOCK_ACTIVE_ORDERS: OperationsActiveOrderDto[] = [
    {
      orderId: 'order-1',
      publicCode: 'BH-PND-001',
      createdAtUtc: new Date(Date.now() - 10 * 60_000).toISOString(),
      currentStatusSinceUtc: new Date(Date.now() - 10 * 60_000).toISOString(),
      orderType: 'Takeaway',
      status: 'Pending',
      customerName: 'Customer Pending',
      customerPhone: '01011111111',
      deliveryAreaNameAr: null,
      deliveryAreaNameEn: null,
      address: null,
      customerNote: 'Extra spicy',
      subtotal: 150,
      deliveryFee: 0,
      total: 150,
      paymentMethod: 'Cash',
      paymentStatus: 'Pending',
      driverId: null,
      driverName: null,
      driverAssignedAtUtc: null,
      items: [{ productNameAr: 'شاورما دجاج', productNameEn: 'Chicken Shawarma', quantity: 2 }],
      statusHistory: [
        {
          previousStatus: 'Pending',
          newStatus: 'Pending',
          actorRole: 'Customer',
          changedAtUtc: new Date(Date.now() - 10 * 60_000).toISOString(),
          notes: 'Order placed',
        },
      ],
    },
    {
      orderId: 'order-2',
      publicCode: 'BH-PRP-002',
      createdAtUtc: new Date(Date.now() - 18 * 60_000).toISOString(),
      currentStatusSinceUtc: new Date(Date.now() - 8 * 60_000).toISOString(),
      orderType: 'Takeaway',
      status: 'Preparing',
      customerName: 'Customer Preparing',
      customerPhone: '01022222222',
      deliveryAreaNameAr: null,
      deliveryAreaNameEn: null,
      address: null,
      customerNote: null,
      subtotal: 200,
      deliveryFee: 0,
      total: 200,
      paymentMethod: 'Cash',
      paymentStatus: 'Pending',
      driverId: null,
      driverName: null,
      driverAssignedAtUtc: null,
      items: [{ productNameAr: 'مشاوي مشكل', productNameEn: 'Mixed Grill', quantity: 1 }],
      statusHistory: [
        {
          previousStatus: 'Pending',
          newStatus: 'Confirmed',
          actorRole: 'Kitchen',
          changedAtUtc: new Date(Date.now() - 15 * 60_000).toISOString(),
          notes: null,
        },
        {
          previousStatus: 'Confirmed',
          newStatus: 'Preparing',
          actorRole: 'Kitchen',
          changedAtUtc: new Date(Date.now() - 8 * 60_000).toISOString(),
          notes: null,
        },
      ],
    },
    {
      orderId: 'order-3',
      publicCode: 'BH-RDY-003',
      createdAtUtc: new Date(Date.now() - 25 * 60_000).toISOString(),
      currentStatusSinceUtc: new Date(Date.now() - 5 * 60_000).toISOString(),
      orderType: 'Delivery',
      status: 'Ready',
      customerName: 'Customer Ready Delivery',
      customerPhone: '01033333333',
      deliveryAreaNameAr: 'مدينة نصر',
      deliveryAreaNameEn: 'Nasr City',
      address: '15 Street 9',
      customerNote: 'Ring the bell twice',
      subtotal: 275,
      deliveryFee: 25,
      total: 300,
      paymentMethod: 'Cash',
      paymentStatus: 'Pending',
      driverId: null,
      driverName: null,
      driverAssignedAtUtc: null,
      items: [{ productNameAr: 'فتة شاورما', productNameEn: 'Shawarma Fatta', quantity: 2 }],
      statusHistory: [
        {
          previousStatus: 'Pending',
          newStatus: 'Confirmed',
          actorRole: 'Kitchen',
          changedAtUtc: new Date(Date.now() - 20 * 60_000).toISOString(),
          notes: null,
        },
        {
          previousStatus: 'Confirmed',
          newStatus: 'Preparing',
          actorRole: 'Kitchen',
          changedAtUtc: new Date(Date.now() - 12 * 60_000).toISOString(),
          notes: null,
        },
        {
          previousStatus: 'Preparing',
          newStatus: 'Ready',
          actorRole: 'Kitchen',
          changedAtUtc: new Date(Date.now() - 5 * 60_000).toISOString(),
          notes: null,
        },
      ],
    },
  ];

  const MOCK_RESPONSE: OperationsCommandCenterResponse = {
    summary: MOCK_SUMMARY,
    attentionItems: MOCK_ATTENTION,
    activeOrders: MOCK_ACTIVE_ORDERS,
  };

  beforeEach(async () => {
    apiMock = {
      getOperationsSnapshot: vi.fn().mockReturnValue(of(MOCK_RESPONSE)),
    };
    sessionMock = {
      signOutManagement: vi.fn().mockReturnValue(of(undefined)),
    };
    realtimeMock = {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      status: vi.fn().mockReturnValue('connected'),
      operationsUpdated$: new Subject<void>(),
      orderCreated$: new Subject<string>(),
      orderStatusChanged$: new Subject<OperationsOrderStatusChangedEvent>(),
      driverAssigned$: new Subject<OperationsDriverAssignedEvent>(),
      reconnected$: new Subject<void>(),
    };

    await TestBed.configureTestingModule({
      imports: [OperationsCommandCenterPage],
      providers: [
        provideRouter([]),
        { provide: ManagementApiService, useValue: apiMock },
        { provide: StaffSessionService, useValue: sessionMock },
        { provide: OperationsRealtimeService, useValue: realtimeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperationsCommandCenterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load operations snapshot and display summary metrics', () => {
    expect(apiMock.getOperationsSnapshot).toHaveBeenCalled();
    expect(component.summary().activeOrders).toBe(3);
    expect(component.summary().pending).toBe(1);
    expect(component.summary().preparing).toBe(1);
    expect(component.summary().ready).toBe(1);
    expect(component.summary().deliveryWaitingForDriver).toBe(1);
    expect(component.attentionItems().length).toBe(2);
    expect(component.activeOrders().length).toBe(3);
    expect(component.loading()).toBe(false);
  });

  it('should filter active orders by status', () => {
    // Initial ALL
    expect(component.filteredOrders().length).toBe(3);

    // Filter to Pending
    component.setStatusFilter('Pending');
    expect(component.filteredOrders().length).toBe(1);
    expect(component.filteredOrders()[0]!.publicCode).toBe('BH-PND-001');

    // Filter to Preparing
    component.setStatusFilter('Preparing');
    expect(component.filteredOrders().length).toBe(1);
    expect(component.filteredOrders()[0]!.publicCode).toBe('BH-PRP-002');

    // Filter to WAITING_DRIVER
    component.setStatusFilter('WAITING_DRIVER');
    expect(component.filteredOrders().length).toBe(1);
    expect(component.filteredOrders()[0]!.publicCode).toBe('BH-RDY-003');

    // Reset to ALL
    component.setStatusFilter('ALL');
    expect(component.filteredOrders().length).toBe(3);
  });

  it('should filter active orders by fulfillment type', () => {
    component.setFulfillmentFilter('Delivery');
    expect(component.filteredOrders().length).toBe(1);
    expect(component.filteredOrders()[0]!.orderType).toBe('Delivery');

    component.setFulfillmentFilter('Takeaway');
    expect(component.filteredOrders().length).toBe(2);

    component.setFulfillmentFilter('ALL');
    expect(component.filteredOrders().length).toBe(3);
  });

  it('should search active orders by PublicCode or customer query', () => {
    component.searchQuery.set('PND');
    expect(component.filteredOrders().length).toBe(1);
    expect(component.filteredOrders()[0]!.publicCode).toBe('BH-PND-001');

    component.searchQuery.set('Customer Ready');
    expect(component.filteredOrders().length).toBe(1);
    expect(component.filteredOrders()[0]!.publicCode).toBe('BH-RDY-003');

    component.searchQuery.set('nonexistent');
    expect(component.filteredOrders().length).toBe(0);
  });

  it('should open and close Quick Order Inspection Side Drawer', () => {
    expect(component.isDrawerOpen()).toBe(false);

    // Open by selectOrder
    component.selectOrder(MOCK_ACTIVE_ORDERS[0]!);
    expect(component.isDrawerOpen()).toBe(true);
    expect(component.selectedOrder()?.publicCode).toBe('BH-PND-001');

    // Close drawer
    component.closeDrawer();
    expect(component.isDrawerOpen()).toBe(false);

    // Open by code
    component.openOrderByCode('BH-RDY-003');
    expect(component.isDrawerOpen()).toBe(true);
    expect(component.selectedOrder()?.publicCode).toBe('BH-RDY-003');

    // Close via onEscape
    component.onEscape();
    expect(component.isDrawerOpen()).toBe(false);
  });

  it('should handle API load error gracefully', () => {
    apiMock.getOperationsSnapshot.mockReturnValue(throwError(() => new Error('Network error')));
    component.loadOperations(true);

    expect(component.error()).not.toBeNull();
    expect(component.loading()).toBe(false);
  });

  it('should trigger debounced refresh on realtime events', () => {
    vi.useFakeTimers();
    try {
      apiMock.getOperationsSnapshot.mockClear();

      // Trigger realtime updates
      realtimeMock.orderCreated$.next('BH-NEW-999');
      realtimeMock.orderStatusChanged$.next({
        publicCode: 'BH-PND-001',
        previousStatus: 'Pending',
        newStatus: 'Confirmed',
        changedAtUtc: new Date().toISOString(),
      });

      // Advance debounce time
      vi.advanceTimersByTime(350);

      expect(apiMock.getOperationsSnapshot).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
