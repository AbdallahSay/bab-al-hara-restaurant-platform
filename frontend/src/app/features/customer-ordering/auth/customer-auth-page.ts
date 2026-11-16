import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { CustomerAuthService } from '../../../core/auth/customer-auth.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { Language } from '../../../core/i18n/translations';

type AuthTab = 'signin' | 'signup';

@Component({
  selector: 'app-customer-auth-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './customer-auth-page.html',
  styleUrl: './customer-auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerAuthPage {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  private readonly authService = inject(CustomerAuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly activeTab = signal<AuthTab>('signin');
  protected readonly name = signal('');
  protected readonly identifier = signal('');
  protected readonly password = signal('');
  protected readonly rememberMe = signal(true);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  setTab(tab: AuthTab): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  setLanguage(lang: Language): void {
    this.language.setLanguage(lang);
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (this.submitting()) {
      return;
    }

    if (!this.identifier().trim() || !this.password().trim()) {
      this.errorMessage.set(this.copy().auth.validationError);
      return;
    }

    if (this.activeTab() === 'signup' && !this.name().trim()) {
      this.errorMessage.set(this.copy().auth.validationError);
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const auth$ =
      this.activeTab() === 'signin'
        ? this.authService.signIn(this.identifier().trim(), this.password(), this.rememberMe())
        : this.authService.signUp(this.name().trim(), this.identifier().trim(), this.password());

    auth$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.submitting.set(false);
        this.successMessage.set(this.copy().auth.successNotice);
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 600);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const detail =
          err.error?.detail ||
          (this.language.current() === 'ar'
            ? 'فشلت عملية المصادقة، يرجى التأكد من صحة البيانات.'
            : 'Authentication failed. Please verify your details.');
        this.errorMessage.set(detail);
      },
    });
  }
}
