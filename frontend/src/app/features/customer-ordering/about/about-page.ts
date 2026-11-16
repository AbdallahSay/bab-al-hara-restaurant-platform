import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerFooter } from '../../../shared/customer-footer/customer-footer';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CustomerHeader, CustomerFooter, RouterLink],
  templateUrl: './about-page.html',
  styleUrl: './about-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
}
