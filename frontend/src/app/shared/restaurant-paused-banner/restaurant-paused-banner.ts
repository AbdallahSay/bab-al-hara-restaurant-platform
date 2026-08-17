import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { LanguageService } from '../../core/i18n/language.service';
import { RestaurantStatusService } from '../../features/customer-ordering/restaurant-status.service';

@Component({
  selector: 'app-restaurant-paused-banner',
  imports: [],
  templateUrl: './restaurant-paused-banner.html',
  styleUrl: './restaurant-paused-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantPausedBanner {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly statusService = inject(RestaurantStatusService);
}
