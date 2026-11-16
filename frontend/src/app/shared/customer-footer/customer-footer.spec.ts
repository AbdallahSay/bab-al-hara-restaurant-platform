import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { CustomerFooter } from './customer-footer';

describe('CustomerFooter', () => {
  it('renders footer links cleanly', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerFooter],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture: ComponentFixture<CustomerFooter> = TestBed.createComponent(CustomerFooter);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.customer-footer')).not.toBeNull();
    expect(compiled.querySelector('.customer-footer__brand')).not.toBeNull();
    expect(compiled.querySelector('.footer-links')).not.toBeNull();
  });
});
