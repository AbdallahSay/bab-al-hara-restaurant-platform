import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LanguageService } from '../../core/i18n/language.service';
import { Language } from '../../core/i18n/translations';
import { CartService } from '../../features/customer-ordering/cart/cart.service';

@Component({
  selector: 'app-customer-header',
  imports: [RouterLink],
  templateUrl: './customer-header.html',
  styleUrl: './customer-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerHeader {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly cart = inject(CartService);

  protected setLanguage(language: Language): void {
    this.language.setLanguage(language);
  }
}
