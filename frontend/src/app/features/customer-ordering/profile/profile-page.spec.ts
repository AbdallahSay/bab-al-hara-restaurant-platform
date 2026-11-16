import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { ProfilePage } from './profile-page';

describe('ProfilePage', () => {
  it('renders profile hero, stats, saved address card and quick links', async () => {
    globalThis.localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture: ComponentFixture<ProfilePage> = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.profile-hero')).not.toBeNull();
    expect(compiled.querySelector('.profile-stats')).not.toBeNull();
    expect(compiled.querySelectorAll('.quick-link-card').length).toBe(4);
  });
});
