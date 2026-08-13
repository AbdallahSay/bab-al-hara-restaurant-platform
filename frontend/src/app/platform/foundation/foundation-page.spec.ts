import { TestBed } from '@angular/core/testing';

import { FoundationPage } from './foundation-page';

describe('FoundationPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';

    await TestBed.configureTestingModule({
      imports: [FoundationPage],
    }).compileComponents();
  });

  it('renders Arabic by default and switches to English LTR', () => {
    const fixture = TestBed.createComponent(FoundationPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('العربية');

    const englishButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('[data-language="en"]');
    englishButton.click();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(document.documentElement.dir).toBe('ltr');
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Arabic and English');
  });

  it('shows a linked validation error when the required field is empty', () => {
    const fixture = TestBed.createComponent(FoundationPage);
    fixture.detectChanges();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('#sample-name');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#sample-name-error')).toBeTruthy();
  });
});
