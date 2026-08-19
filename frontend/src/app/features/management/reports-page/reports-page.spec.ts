import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LanguageService } from '../../../core/i18n/language.service';
import { StaffSessionService } from '../../kitchen/staff-session.service';
import { ManagementApiService } from '../management-api.service';
import { ManagementReportResponse } from '../management.models';
import { ReportsPage } from './reports-page';

describe('ReportsPage', () => {
  let component: ReportsPage;
  let fixture: ComponentFixture<ReportsPage>;
  let managementApiMock: { getReports: ReturnType<typeof vi.fn> };
  let languageService: LanguageService;
  let staffSessionMock: { signOutManagement: ReturnType<typeof vi.fn> };
  let router: Router;

  const sampleReportData: ManagementReportResponse = {
    fromDate: '2026-08-01',
    toDate: '2026-08-20',
    fulfillmentFilter: 'All',
    generatedAtUtc: '2026-08-20T14:30:00Z',
    summary: {
      completedSalesRevenue: 48500.5,
      completedOrdersCount: 142,
      averageOrderValue: 341.55,
      totalOrdersPlaced: 150,
    },
    dailyTrends: [
      { date: '2026-08-18', revenue: 15200, completedOrdersCount: 45, totalOrdersCount: 48 },
      { date: '2026-08-19', revenue: 16400, completedOrdersCount: 48, totalOrdersCount: 50 },
      { date: '2026-08-20', revenue: 16900.5, completedOrdersCount: 49, totalOrdersCount: 52 },
    ],
    fulfillmentBreakdown: {
      delivery: {
        orderType: 'Delivery',
        count: 95,
        revenue: 33500.5,
        deliveryFees: 2850,
        percentageOfTotal: 67,
      },
      takeaway: {
        orderType: 'Takeaway',
        count: 47,
        revenue: 15000,
        deliveryFees: 0,
        percentageOfTotal: 33,
      },
    },
    bestSellingItems: [
      {
        rank: 1,
        itemId: 'item-1',
        itemNameAr: 'شاورما دجاج ع الفحم',
        itemNameEn: 'Charcoal Chicken Shawarma',
        quantitySold: 120,
        totalRevenue: 14400,
      },
      {
        rank: 2,
        itemId: 'item-2',
        itemNameAr: 'كباب حلبي مشكل',
        itemNameEn: 'Aleppo Mixed Kebab',
        quantitySold: 85,
        totalRevenue: 21250,
      },
    ],
    operationalTiming: {
      averagePreparationMinutes: 14.5,
      averageDeliveryMinutes: 22.8,
      averageTotalFulfillmentMinutes: 37.3,
    },
    hourlyDistribution: [
      { hour: 12, hourLabel: '12:00 PM', orderCount: 18, revenue: 6200 },
      { hour: 13, hourLabel: '1:00 PM', orderCount: 32, revenue: 11500 },
      { hour: 14, hourLabel: '2:00 PM', orderCount: 28, revenue: 9800 },
    ],
  };

  const emptyReportData: ManagementReportResponse = {
    fromDate: '2026-08-20',
    toDate: '2026-08-20',
    fulfillmentFilter: 'All',
    generatedAtUtc: '2026-08-20T14:30:00Z',
    summary: {
      completedSalesRevenue: 0,
      completedOrdersCount: 0,
      averageOrderValue: 0,
      totalOrdersPlaced: 0,
    },
    dailyTrends: [],
    fulfillmentBreakdown: {
      delivery: {
        orderType: 'Delivery',
        count: 0,
        revenue: 0,
        deliveryFees: 0,
        percentageOfTotal: 0,
      },
      takeaway: {
        orderType: 'Takeaway',
        count: 0,
        revenue: 0,
        deliveryFees: 0,
        percentageOfTotal: 0,
      },
    },
    bestSellingItems: [],
    operationalTiming: {
      averagePreparationMinutes: null,
      averageDeliveryMinutes: null,
      averageTotalFulfillmentMinutes: null,
    },
    hourlyDistribution: [],
  };

  beforeEach(async () => {
    managementApiMock = {
      getReports: vi.fn().mockReturnValue(of(sampleReportData)),
    };

    staffSessionMock = {
      signOutManagement: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [ReportsPage],
      providers: [
        provideRouter([]),
        { provide: ManagementApiService, useValue: managementApiMock },
        { provide: StaffSessionService, useValue: staffSessionMock },
      ],
    }).compileComponents();

    languageService = TestBed.inject(LanguageService);
    languageService.setLanguage('ar');
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(ReportsPage);
    component = fixture.componentInstance;
  });

  it('should initialize and load reports data for today by default', () => {
    fixture.detectChanges();

    expect(component.activePreset()).toBe('today');
    expect(managementApiMock.getReports).toHaveBeenCalledTimes(1);
    expect(component.loading()).toBe(false);
    expect(component.hasData()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-title')?.textContent).toContain('تقارير المبيعات');
  });

  it('should switch presets to yesterday and last 7 days', () => {
    fixture.detectChanges();

    component.setPreset('yesterday');
    expect(component.activePreset()).toBe('yesterday');
    expect(component.fromDate()).toBe(component.toDate());
    expect(managementApiMock.getReports).toHaveBeenCalledTimes(2);

    component.setPreset('last7days');
    expect(component.activePreset()).toBe('last7days');
    expect(managementApiMock.getReports).toHaveBeenCalledTimes(3);
  });

  it('should validate custom date range and show error when from > to', () => {
    fixture.detectChanges();

    component.fromDate.set('2026-08-25');
    component.toDate.set('2026-08-20');
    component.onCustomDateChange();
    fixture.detectChanges();

    expect(component.dateValidationError()).not.toBeNull();
    const alertEl = fixture.nativeElement.querySelector('.alert-validation');
    expect(alertEl).toBeTruthy();
  });

  it('should toggle fulfillment filter and reload report data', () => {
    fixture.detectChanges();

    component.setFulfillmentFilter('Delivery');
    expect(component.fulfillmentFilter()).toBe('Delivery');
    expect(managementApiMock.getReports).toHaveBeenLastCalledWith(
      expect.objectContaining({ fulfillment: 'Delivery' }),
    );
  });

  it('should render all 4 summary KPI cards with correct metric values', () => {
    fixture.detectChanges();

    const kpiValues = fixture.nativeElement.querySelectorAll('.kpi-value');
    expect(kpiValues.length).toBe(4);

    // Completed Sales, Completed Orders, AOV, Total Placed
    expect(kpiValues[0].textContent).toContain(component.formatCurrency(48500.5));
    expect(kpiValues[1].textContent).toBe('142');
    expect(kpiValues[2].textContent).toContain(component.formatCurrency(341.55));
    expect(kpiValues[3].textContent).toBe('150');
  });

  it('should render daily sales trend chart and toggle accessible table view', () => {
    fixture.detectChanges();

    const barCols = fixture.nativeElement.querySelectorAll('.trend-bar-col');
    expect(barCols.length).toBe(3);

    // Toggle to Table view
    component.viewMode.set('table');
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector(
      '.table-responsive:not(.sr-only) .report-table',
    );
    expect(table).toBeTruthy();
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('should render fulfillment breakdown metrics correctly', () => {
    fixture.detectChanges();

    expect(component.deliverySharePercent()).toBe(67);
    expect(component.takeawaySharePercent()).toBe(33);

    const deliveryCard = fixture.nativeElement.querySelector('.fulfillment-card--delivery');
    expect(deliveryCard.textContent).toContain('95');
    expect(deliveryCard.textContent).toContain(component.formatCurrency(33500.5));

    const takeawayCard = fixture.nativeElement.querySelector('.fulfillment-card--takeaway');
    expect(takeawayCard.textContent).toContain('47');
    expect(takeawayCard.textContent).toContain(component.formatCurrency(15000));
  });

  it('should render best-selling items in Arabic and English based on active language', () => {
    fixture.detectChanges();

    let rows = fixture.nativeElement.querySelectorAll('.items-table tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('شاورما دجاج ع الفحم');
    expect(rows[0].textContent).toContain('120');

    // Switch to English
    component.setLanguage('en');
    fixture.detectChanges();

    rows = fixture.nativeElement.querySelectorAll('.items-table tbody tr');
    expect(rows[0].textContent).toContain('Charcoal Chicken Shawarma');
  });

  it('should render operational timing metrics and peak hours', () => {
    fixture.detectChanges();

    const timingValues = fixture.nativeElement.querySelectorAll('.timing-value');
    expect(timingValues.length).toBe(3);
    expect(timingValues[0].textContent).toContain('15');
    expect(timingValues[1].textContent).toContain('23');
    expect(timingValues[2].textContent).toContain('37');

    const hourlyCols = fixture.nativeElement.querySelectorAll('.hourly-bar-col');
    expect(hourlyCols.length).toBe(3);
  });

  it('should render honest empty state when summary total orders is 0', () => {
    managementApiMock.getReports.mockReturnValue(of(emptyReportData));

    component.loadReports();
    fixture.detectChanges();

    expect(component.hasData()).toBe(false);
    const emptyCard = fixture.nativeElement.querySelector('.empty-state-card');
    expect(emptyCard).toBeTruthy();
    expect(emptyCard.textContent).toContain('لا توجد بيانات مسجلة في هذه الفترة');
  });

  it('should render error state with retry button on API failure', () => {
    managementApiMock.getReports.mockReturnValue(
      throwError(() => ({ status: 500, message: 'Server Error' })),
    );

    component.loadReports();
    fixture.detectChanges();

    expect(component.error()).not.toBeNull();
    const errorAlert = fixture.nativeElement.querySelector('.alert-error');
    expect(errorAlert).toBeTruthy();

    // Clicking retry calls loadReports
    managementApiMock.getReports.mockReturnValue(of(sampleReportData));
    const retryBtn = fixture.nativeElement.querySelector('.btn-retry');
    retryBtn.click();
    fixture.detectChanges();

    expect(component.error()).toBeNull();
    expect(component.hasData()).toBe(true);
  });

  it('should redirect to sign-in on 401 unauthorized error', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    managementApiMock.getReports.mockReturnValue(throwError(() => ({ status: 401 })));

    component.loadReports();
    expect(navigateSpy).toHaveBeenCalledWith(['/management/sign-in']);
  });

  it('should sign out and clear session', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.signOut();

    expect(staffSessionMock.signOutManagement).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/management/sign-in']);
  });
});
