import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerFooter } from '../../../shared/customer-footer/customer-footer';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';
import { CustomerApiService } from '../customer-api.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CustomerHeader, CustomerFooter],
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {
  private readonly api = inject(CustomerApiService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;

  protected readonly name = signal('');
  protected readonly phoneOrEmail = signal('');
  protected readonly subject = signal('');
  protected readonly message = signal('');

  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly dialablePhone = computed(() => {
    const raw = this.copy().contact.phoneValue;
    const digits = raw.replace(/\D/g, '');
    return digits.length >= 8 ? raw : null;
  });

  protected readonly whatsappDigits = computed(() => {
    const raw = this.copy().contact.whatsappValue;
    const digits = raw.replace(/\D/g, '');
    return digits.length >= 8 ? digits : null;
  });

  onSubmit(event: Event): void {
    event.preventDefault();

    if (this.submitting()) {
      return;
    }

    if (!this.name().trim() || !this.phoneOrEmail().trim() || !this.message().trim()) {
      this.errorMessage.set(this.copy().contact.validationError);
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.api
      .submitContactInquiry({
        name: this.name().trim(),
        phoneOrEmail: this.phoneOrEmail().trim(),
        subject: this.subject().trim() || undefined,
        message: this.message().trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          const detail =
            err.error?.detail ||
            (this.language.current() === 'ar'
              ? 'حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى لاحقاً.'
              : 'Failed to send your inquiry. Please try again later.');
          this.errorMessage.set(detail);
        },
      });
  }
}
