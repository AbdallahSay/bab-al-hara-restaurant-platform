import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatMoney, localizedText } from '../../../core/i18n/formatters';
import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';
import { RecentOrdersService } from '../recent-orders.service';
import { OrderReceiptService } from './order-receipt.service';

@Component({
  selector: 'app-order-success-page',
  imports: [CustomerHeader, RouterLink],
  templateUrl: './order-success-page.html',
  styleUrl: './order-success-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSuccessPage {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly receipt = inject(OrderReceiptService).current;
  private readonly recentOrders = inject(RecentOrdersService);

  constructor() {
    const currentReceipt = this.receipt();
    if (currentReceipt?.order.publicCode) {
      this.recentOrders.registerOrder(currentReceipt.order.publicCode);
      this.recentOrders.setActiveOrderCode(currentReceipt.order.publicCode);
    }
  }

  protected money(value: number): string {
    return formatMoney(value, this.language.current());
  }

  protected areaName(arabic: string | null, english: string | null): string {
    return localizedText(this.language.current(), arabic ?? '', english ?? '');
  }
}
