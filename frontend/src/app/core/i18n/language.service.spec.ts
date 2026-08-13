import { TestBed } from '@angular/core/testing';

import { LanguageService } from './language.service';

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    TestBed.configureTestingModule({});
  });

  it('defaults to Arabic and RTL', () => {
    const service = TestBed.inject(LanguageService);
    TestBed.flushEffects();

    expect(service.current()).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('switches the document to English LTR and persists the choice', () => {
    const service = TestBed.inject(LanguageService);

    service.setLanguage('en');
    TestBed.flushEffects();

    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(localStorage.getItem('bab-al-hara.language')).toBe('en');
  });
});
