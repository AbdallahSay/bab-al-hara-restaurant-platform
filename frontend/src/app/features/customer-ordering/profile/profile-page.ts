import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CustomerAuthService } from '../../../core/auth/customer-auth.service';
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
  protected readonly authService = inject(CustomerAuthService);
  private readonly contactService = inject(CustomerContactProfileService);
  private readonly preferencesService = inject(CustomerPreferencesService);
  private readonly recentOrdersService = inject(RecentOrdersService);
  private readonly wishlistService = inject(WishlistService);

  protected readonly displayName = computed(() => {
    if (this.authService.isAuthenticated()) {
      return (
        this.authService.currentUser()?.fullName ||
        (this.language.current() === 'ar' ? 'عميل باب الحارة' : 'Bab Al Hara Customer')
      );
    }
    const contact = this.contactService.profile();
    return (
      contact?.name || (this.language.current() === 'ar' ? 'ضيف باب الحارة' : 'Bab Al Hara Guest')
    );
  });

  protected readonly displayPhone = computed(() => {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.currentUser();
      return user?.phoneNumber || user?.email || '—';
    }
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

  protected signOut(): void {
    this.authService.signOut().subscribe();
  }
}
