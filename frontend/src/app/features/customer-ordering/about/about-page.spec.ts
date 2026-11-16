import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { AboutPage } from './about-page';

describe('AboutPage', () => {
  it('renders story, values and statistics', async () => {
    await TestBed.configureTestingModule({
      imports: [AboutPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture: ComponentFixture<AboutPage> = TestBed.createComponent(AboutPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.about-hero')).not.toBeNull();
    expect(compiled.querySelector('.about-story-section')).not.toBeNull();
    expect(compiled.querySelector('.stats-section')).not.toBeNull();
    expect(compiled.querySelector('.values-section')).not.toBeNull();
    expect(compiled.querySelector('.about-cta')).not.toBeNull();
  });
});
