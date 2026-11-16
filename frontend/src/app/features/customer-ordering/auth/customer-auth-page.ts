import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { LanguageService } from '../../../core/i18n/language.service';
import { Language } from '../../../core/i18n/translations';
import { CustomerContactProfileService } from '../customer-contact-profile.service';

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
  private readonly contactService = inject(CustomerContactProfileService);
  private readonly router = inject(Router);

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

    // Save profile details locally so user profile reflects authenticated info
    const resolvedName = this.name().trim() || this.identifier().trim().split('@')[0] || 'عميل باب الحارة';
    this.contactService.save({
      name: resolvedName,
      phone: this.identifier().trim(),
    });

    setTimeout(() => {
      this.submitting.set(false);
      this.successMessage.set(this.copy().auth.successNotice);
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 800);
    }, 500);
  }
}
