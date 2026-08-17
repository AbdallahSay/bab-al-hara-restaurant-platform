import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatMoney, localizedText } from '../../../core/i18n/formatters';
import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';
import { TrackingCredentialService } from '../../order-tracking/tracking-credential.service';
import { OrderReceiptService } from './order-receipt.service';

@Component({
  selector: 'app-order-success-page',
  imports: [CustomerHeader, RouterLink],
  templateUrl: './order-success-page.html',
  styleUrl: './order-success-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSuccessPage {
  private readonly credentials = inject(TrackingCredentialService);
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly receipt = inject(OrderReceiptService).current;

  constructor() {
    effect(() => {
      const currentReceipt = this.receipt();
      if (currentReceipt?.order.trackingToken) {
        this.credentials.store(currentReceipt.order.publicCode, currentReceipt.order.trackingToken);
      }
    });
  }

  protected money(value: number): string {
    return formatMoney(value, this.language.current());
  }

  protected areaName(arabic: string | null, english: string | null): string {
    return localizedText(this.language.current(), arabic ?? '', english ?? '');
  }
}
