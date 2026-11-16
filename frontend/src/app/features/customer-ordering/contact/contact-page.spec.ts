import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { ContactPage } from './contact-page';

describe('ContactPage', () => {
  it('renders contact info cards and interactive form', async () => {
    await TestBed.configureTestingModule({
      imports: [ContactPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture: ComponentFixture<ContactPage> = TestBed.createComponent(ContactPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.contact-hero')).not.toBeNull();
    expect(compiled.querySelectorAll('.info-card').length).toBe(4);
    expect(compiled.querySelector('.contact-form')).not.toBeNull();
  });
});
