import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerFooter } from '../../../shared/customer-footer/customer-footer';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';
import { CustomerContactProfileService } from '../customer-contact-profile.service';
import { CustomerPreferencesService } from '../customer-preferences.service';
import { RecentOrdersService } from '../recent-orders.service';
import { WishlistService } from '../wishlist/wishlist.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CustomerHeader, CustomerFooter, RouterLink],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  private readonly contactService = inject(CustomerContactProfileService);
  private readonly preferencesService = inject(CustomerPreferencesService);
  private readonly recentOrdersService = inject(RecentOrdersService);
  private readonly wishlistService = inject(WishlistService);

  protected readonly displayName = computed(() => {
    const contact = this.contactService.profile();
    return (
      contact?.name || (this.language.current() === 'ar' ? 'ضيف باب الحارة' : 'Bab Al Hara Guest')
    );
  });

  protected readonly displayPhone = computed(() => {
    const contact = this.contactService.profile();
    return contact?.phone || '—';
  });

  protected readonly savedAddress = computed(() => {
    const prefs = this.preferencesService.getPreferences();
    return prefs?.address || null;
  });

  protected readonly totalOrdersCount = computed(() => {
    return this.recentOrdersService.orders().length;
  });

  protected readonly wishlistCount = computed(() => {
    return this.wishlistService.count();
  });
}
