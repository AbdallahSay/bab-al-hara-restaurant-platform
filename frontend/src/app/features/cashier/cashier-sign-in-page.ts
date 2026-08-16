import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { LanguageService } from '../../core/i18n/language.service';
import { Language } from '../../core/i18n/translations';
import { StaffSessionService } from '../kitchen/staff-session.service';

@Component({
  selector: 'app-cashier-sign-in-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cashier-sign-in-page.html',
  styleUrl: './cashier-sign-in-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashierSignInPage {
  private readonly sessions = inject(StaffSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly submitted = signal(false);
  protected readonly sending = signal(false);
  protected readonly failed = signal(false);
  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected setLanguage(language: Language): void {
    this.language.setLanguage(language);
  }

  protected signIn(): void {
    this.submitted.set(true);
    this.failed.set(false);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.sending.set(true);
    this.sessions
      .signIn(this.form.controls.email.value.trim(), this.form.controls.password.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate(['/cashier']),
        error: () => {
          this.sending.set(false);
          this.failed.set(true);
        },
      });
  }
}
