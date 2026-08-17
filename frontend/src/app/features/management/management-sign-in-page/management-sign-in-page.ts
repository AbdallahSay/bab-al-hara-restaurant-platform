import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LanguageService } from '../../../core/i18n/language.service';
import { StaffSessionService } from '../../kitchen/staff-session.service';

@Component({
  selector: 'app-management-sign-in-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './management-sign-in-page.html',
  styleUrl: './management-sign-in-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementSignInPage {
  private readonly session = inject(StaffSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  signIn(): void {
    if (this.loading() || this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { email, password } = this.form.getRawValue();
    this.session
      .signIn(email, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/management';
          void this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.loading.set(false);
          if (err.status === 401) {
            this.error.set(this.copy().management.errors.unauthorized);
          } else if (err.status === 403) {
            this.error.set(this.copy().management.errors.forbidden);
          } else {
            this.error.set(this.copy().management.errors.loadFailed);
          }
        },
      });
  }

  setLanguage(lang: 'ar' | 'en'): void {
    this.language.setLanguage(lang);
  }
}
