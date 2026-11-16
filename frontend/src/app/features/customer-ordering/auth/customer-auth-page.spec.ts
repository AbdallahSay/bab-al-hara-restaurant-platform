import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { CustomerAuthPage } from './customer-auth-page';

describe('CustomerAuthPage', () => {
  it('renders split auth card and tab toggle cleanly', async () => {
    globalThis.localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [CustomerAuthPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture: ComponentFixture<CustomerAuthPage> = TestBed.createComponent(CustomerAuthPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.auth-brand-side')).not.toBeNull();
    expect(compiled.querySelector('.auth-card')).not.toBeNull();
    expect(compiled.querySelectorAll('.tab-btn').length).toBe(2);
    expect(compiled.querySelector('.button--guest')).not.toBeNull();
  });
});
