import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { formatMoney, localizedText } from '../../../core/i18n/formatters';
import { LanguageService } from '../../../core/i18n/language.service';
import { StaffSessionService } from '../../kitchen/staff-session.service';
import { ManagementApiService } from '../management-api.service';
import {
  BestSellingItemDto,
  DatePreset,
  DailySalesTrendDto,
  FulfillmentBreakdownDto,
  FulfillmentFilterType,
  HourlyDistributionDto,
  ManagementReportResponse,
  OperationalTimingDto,
  ReportSummaryDto,
} from '../management.models';

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './reports-page.html',
  styleUrls: ['./reports-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage implements OnInit {
  private readonly managementApi = inject(ManagementApiService);
  private readonly languageService = inject(LanguageService);
  private readonly session = inject(StaffSessionService);
  private readonly router = inject(Router);

  readonly language = this.languageService;
  readonly copy = this.languageService.copy;

  // Filter state
  readonly activePreset = signal<DatePreset>('today');
  readonly fromDate = signal<string>(toLocalDateString(new Date()));
  readonly toDate = signal<string>(toLocalDateString(new Date()));
  readonly fulfillmentFilter = signal<FulfillmentFilterType>('All');

  // View state
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly reportData = signal<ManagementReportResponse | null>(null);
  readonly lastUpdated = signal<Date | null>(null);
  readonly viewMode = signal<'chart' | 'table'>('chart');
  readonly hoveredTrendPoint = signal<DailySalesTrendDto | null>(null);

  // Client validation
  readonly dateValidationError = computed<string | null>(() => {
    const from = this.fromDate();
    const to = this.toDate();
    if (!from || !to) {
      return this.copy().reports.invalidDateRange;
    }
    if (from > to) {
      return this.copy().reports.invalidDateRange;
    }
    return null;
  });

  // Computed data models
  readonly summary = computed<ReportSummaryDto>(() => {
    return (
      this.reportData()?.summary ?? {
        completedSalesRevenue: 0,
        completedOrdersCount: 0,
        averageOrderValue: 0,
        totalOrdersPlaced: 0,
      }
    );
  });

  readonly dailyTrends = computed<readonly DailySalesTrendDto[]>(() => {
    return this.reportData()?.dailyTrends ?? [];
  });

  readonly fulfillmentBreakdown = computed<FulfillmentBreakdownDto | null>(() => {
    return this.reportData()?.fulfillmentBreakdown ?? null;
  });

  readonly bestSellingItems = computed<readonly BestSellingItemDto[]>(() => {
    return this.reportData()?.bestSellingItems ?? [];
  });

  readonly operationalTiming = computed<OperationalTimingDto | null>(() => {
    return this.reportData()?.operationalTiming ?? null;
  });

  readonly hourlyDistribution = computed<readonly HourlyDistributionDto[]>(() => {
    return this.reportData()?.hourlyDistribution ?? [];
  });

  readonly hasData = computed<boolean>(() => {
    const data = this.reportData();
    if (!data) return false;
    return (
      data.summary.totalOrdersPlaced > 0 ||
      data.summary.completedOrdersCount > 0 ||
      data.summary.completedSalesRevenue > 0
    );
  });

  // Chart scaling calculations
  readonly maxDailyRevenue = computed<number>(() => {
    const trends = this.dailyTrends();
    if (trends.length === 0) return 1;
    const max = Math.max(...trends.map((t) => t.revenue));
    return max > 0 ? max : 1;
  });

  readonly maxDailyOrders = computed<number>(() => {
    const trends = this.dailyTrends();
    if (trends.length === 0) return 1;
    const max = Math.max(
      ...trends.map((t) => Math.max(t.completedOrdersCount, t.totalOrdersCount)),
    );
    return max > 0 ? max : 1;
  });

  readonly maxHourlyOrders = computed<number>(() => {
    const distribution = this.hourlyDistribution();
    if (distribution.length === 0) return 1;
    const max = Math.max(...distribution.map((h) => h.orderCount));
    return max > 0 ? max : 1;
  });

  // Fulfillment shares
  readonly deliverySharePercent = computed<number>(() => {
    const breakdown = this.fulfillmentBreakdown();
    if (!breakdown) return 0;
    const totalCount = breakdown.delivery.count + breakdown.takeaway.count;
    if (totalCount === 0) return 0;
    return Math.round((breakdown.delivery.count / totalCount) * 100);
  });

  readonly takeawaySharePercent = computed<number>(() => {
    const breakdown = this.fulfillmentBreakdown();
    if (!breakdown) return 0;
    const totalCount = breakdown.delivery.count + breakdown.takeaway.count;
    if (totalCount === 0) return 0;
    return Math.round((breakdown.takeaway.count / totalCount) * 100);
  });

  ngOnInit(): void {
    this.setPreset('today');
  }

  setPreset(preset: DatePreset): void {
    this.activePreset.set(preset);
    const now = new Date();

    if (preset === 'today') {
      const today = toLocalDateString(now);
      this.fromDate.set(today);
      this.toDate.set(today);
    } else if (preset === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = toLocalDateString(yesterday);
      this.fromDate.set(yesterdayStr);
      this.toDate.set(yesterdayStr);
    } else if (preset === 'last7days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      this.fromDate.set(toLocalDateString(start));
      this.toDate.set(toLocalDateString(now));
    } else if (preset === 'last30days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      this.fromDate.set(toLocalDateString(start));
      this.toDate.set(toLocalDateString(now));
    }

    this.loadReports();
  }

  onCustomDateChange(): void {
    this.activePreset.set('custom');
    if (!this.dateValidationError()) {
      this.loadReports();
    }
  }

  setFulfillmentFilter(filter: FulfillmentFilterType): void {
    if (this.fulfillmentFilter() !== filter) {
      this.fulfillmentFilter.set(filter);
      this.loadReports();
    }
  }

  loadReports(isBackground = false): void {
    if (this.dateValidationError()) {
      return;
    }

    if (isBackground) {
      this.refreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);

    this.managementApi
      .getReports({
        from: this.fromDate(),
        to: this.toDate(),
        fulfillment: this.fulfillmentFilter(),
      })
      .subscribe({
        next: (data) => {
          this.reportData.set(data);
          this.lastUpdated.set(new Date());
          this.loading.set(false);
          this.refreshing.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.refreshing.set(false);
          if (err.status === 401 || err.status === 403) {
            this.router.navigate(['/management/sign-in']);
          } else {
            this.error.set(this.copy().reports.errors.loadFailed);
          }
        },
      });
  }

  formatCurrency(value: number): string {
    return formatMoney(value, this.language.current());
  }

  localizedItemName(item: BestSellingItemDto): string {
    return localizedText(this.language.current(), item.itemNameAr, item.itemNameEn);
  }

  formatMinutes(minutes: number | null): string {
    if (minutes === null || minutes === undefined || isNaN(minutes)) {
      return this.copy().reports.timing.notAvailable;
    }
    return `${Math.round(minutes)} ${this.copy().reports.timing.minutesUnit}`;
  }

  setLanguage(lang: 'ar' | 'en'): void {
    this.language.setLanguage(lang);
  }

  signOut(): void {
    this.session.signOutManagement().subscribe({
      next: () => void this.router.navigate(['/management/sign-in']),
      error: () => void this.router.navigate(['/management/sign-in']),
    });
  }
}
