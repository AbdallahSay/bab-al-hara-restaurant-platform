import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

import { LanguageService } from '../../core/i18n/language.service';
import { CustomerApiService } from './customer-api.service';
import { RestaurantPublicStatusResponse } from './order.models';

@Injectable({ providedIn: 'root' })
export class RestaurantStatusService {
  private readonly api = inject(CustomerApiService);
  private readonly language = inject(LanguageService);

  readonly status = signal<RestaurantPublicStatusResponse | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<boolean>(false);

  readonly isPaused = computed(() => {
    const s = this.status();
    return s !== null && !s.acceptingOrders;
  });

  readonly pauseMessage = computed(() => {
    const s = this.status();
    const lang = this.language.current();
    const fallback = this.language.copy().common.restaurantPausedFallback;

    if (lang === 'ar') {
      return s?.messageAr?.trim() || fallback;
    }
    return s?.messageEn?.trim() || fallback;
  });

  loadStatus(): Observable<RestaurantPublicStatusResponse> {
    this.loading.set(true);
    this.error.set(false);

    return this.api.getRestaurantStatus().pipe(
      tap((res) => {
        this.status.set(res);
        this.loading.set(false);
      }),
      catchError(() => {
        this.error.set(true);
        this.loading.set(false);
        // Default to acceptingOrders: true when unreachable to avoid blocking browsing
        const fallbackStatus: RestaurantPublicStatusResponse = {
          acceptingOrders: true,
          messageAr: null,
          messageEn: null,
        };
        return of(fallbackStatus);
      }),
    );
  }

  setPausedManually(messageAr?: string | null, messageEn?: string | null): void {
    this.status.set({
      acceptingOrders: false,
      messageAr: messageAr ?? null,
      messageEn: messageEn ?? null,
    });
  }
}
