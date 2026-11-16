import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { AccountSettingsPage } from './account-settings-page';

describe('AccountSettingsPage', () => {
  it('renders settings form cards cleanly', async () => {
    globalThis.localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AccountSettingsPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture: ComponentFixture<AccountSettingsPage> =
      TestBed.createComponent(AccountSettingsPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.settings-hero')).not.toBeNull();
    expect(compiled.querySelectorAll('.settings-card').length).toBe(2);
    expect(compiled.querySelector('button[type="submit"]')).not.toBeNull();
  });
});
