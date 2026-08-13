import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { Language, UI_COPY } from './translations';

const LANGUAGE_STORAGE_KEY = 'bab-al-hara.language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly current = signal<Language>(this.readStoredLanguage());
  readonly direction = computed(() => (this.current() === 'ar' ? 'rtl' : 'ltr'));
  readonly copy = computed(() => UI_COPY[this.current()]);

  constructor() {
    effect(() => {
      const language = this.current();
      this.document.documentElement.lang = language;
      this.document.documentElement.dir = this.direction();

      if (this.isBrowser) {
        globalThis.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      }
    });
  }

  setLanguage(language: Language): void {
    this.current.set(language);
  }

  private readStoredLanguage(): Language {
    if (!this.isBrowser) {
      return 'ar';
    }

    const storedLanguage = globalThis.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return storedLanguage === 'en' ? 'en' : 'ar';
  }
}
