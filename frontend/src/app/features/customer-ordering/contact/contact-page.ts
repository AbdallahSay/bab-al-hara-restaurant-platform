import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerFooter } from '../../../shared/customer-footer/customer-footer';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CustomerHeader, CustomerFooter],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;

  protected readonly name = signal('');
  protected readonly phoneOrEmail = signal('');
  protected readonly subject = signal('');
  protected readonly message = signal('');

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.name().trim() || !this.phoneOrEmail().trim() || !this.message().trim()) {
      this.errorMessage.set(this.copy().contact.validationError);
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    // Simulate reliable inquiry delivery with feedback
    setTimeout(() => {
      this.submitting.set(false);
      this.submitted.set(true);
    }, 600);
  }
}
