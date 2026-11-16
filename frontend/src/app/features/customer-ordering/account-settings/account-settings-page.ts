import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerFooter } from '../../../shared/customer-footer/customer-footer';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';
import { CustomerContactProfileService } from '../customer-contact-profile.service';
import { CustomerPreferencesService } from '../customer-preferences.service';

@Component({
  selector: 'app-account-settings-page',
  standalone: true,
  imports: [CustomerHeader, CustomerFooter],
  templateUrl: './account-settings-page.html',
  styleUrl: './account-settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsPage implements OnInit {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  private readonly contactService = inject(CustomerContactProfileService);
  private readonly preferencesService = inject(CustomerPreferencesService);

  protected readonly name = signal('');
  protected readonly phone = signal('');
  protected readonly street = signal('');
  protected readonly building = signal('');
  protected readonly floor = signal('');
  protected readonly notes = signal('');
  protected readonly toastMessage = signal<string | null>(null);

  ngOnInit(): void {
    const contact = this.contactService.profile();
    if (contact) {
      this.name.set(contact.name);
      this.phone.set(contact.phone);
    }

    const prefs = this.preferencesService.getPreferences();
    if (prefs?.address) {
      this.street.set(prefs.address);
    }
  }

  onSave(event: Event): void {
    event.preventDefault();

    if (this.name().trim() && this.phone().trim()) {
      this.contactService.save({
        name: this.name().trim(),
        phone: this.phone().trim(),
      });
    }

    const fullAddress = [
      this.street().trim(),
      this.building().trim() ? `مبنى ${this.building().trim()}` : '',
      this.floor().trim() ? `طابق ${this.floor().trim()}` : '',
      this.notes().trim() ? `(${this.notes().trim()})` : '',
    ]
      .filter(Boolean)
      .join(' - ');

    if (fullAddress) {
      const existing = this.preferencesService.getPreferences();
      this.preferencesService.savePreferences({
        orderType: existing?.orderType || 'Delivery',
        deliveryAreaId: existing?.deliveryAreaId || null,
        deliveryAreaNameAr: existing?.deliveryAreaNameAr || null,
        deliveryAreaNameEn: existing?.deliveryAreaNameEn || null,
        address: fullAddress,
      });
    }

    this.showToast(this.copy().accountSettings.savedSuccess);
  }

  onClearData(): void {
    if (confirm(this.copy().accountSettings.clearConfirm)) {
      this.contactService.clear();
      this.preferencesService.clearAll();
      this.name.set('');
      this.phone.set('');
      this.street.set('');
      this.building.set('');
      this.floor.set('');
      this.notes.set('');
      this.showToast(this.copy().accountSettings.clearedSuccess);
    }
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
}
