import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LanguageService } from '../../core/i18n/language.service';

@Component({
  selector: 'app-customer-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './customer-footer.html',
  styleUrl: './customer-footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFooter {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
}
