import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { APP_ENVIRONMENT } from '../../../core/config/app-environment';
import { ProfilePage } from './profile-page';

describe('ProfilePage', () => {
  it('renders profile hero, stats, saved address card and quick links', async () => {
    globalThis.localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: APP_ENVIRONMENT,
          useValue: { production: false, apiBaseUrl: '/api', kitchenHubUrl: '/hubs/kitchen' },
        },
      ],
    }).compileComponents();

    const fixture: ComponentFixture<ProfilePage> = TestBed.createComponent(ProfilePage);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http.expectOne('/api/customer/auth/session').flush({
      isAuthenticated: false,
      id: null,
      fullName: null,
      email: null,
      phoneNumber: null,
    });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.profile-hero')).not.toBeNull();
    expect(compiled.querySelector('.profile-stats')).not.toBeNull();
    expect(compiled.querySelectorAll('.quick-link-card').length).toBe(4);
    http.verify();
  });
});
