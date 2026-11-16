import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { APP_ENVIRONMENT } from '../../../core/config/app-environment';
import { ContactPage } from './contact-page';

describe('ContactPage', () => {
  it('renders contact info cards and interactive form', async () => {
    await TestBed.configureTestingModule({
      imports: [ContactPage],
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

    const fixture: ComponentFixture<ContactPage> = TestBed.createComponent(ContactPage);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.contact-hero')).not.toBeNull();
    expect(compiled.querySelectorAll('.info-card').length).toBe(4);
    expect(compiled.querySelector('.contact-form')).not.toBeNull();
  });

  it('submits contact inquiry to backend and shows success notice upon server response', async () => {
    await TestBed.configureTestingModule({
      imports: [ContactPage],
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

    const fixture: ComponentFixture<ContactPage> = TestBed.createComponent(ContactPage);
    const component = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    // Fill form
    (component as unknown as { name: { set: (v: string) => void } }).name.set('سامح كمال');
    (component as unknown as { phoneOrEmail: { set: (v: string) => void } }).phoneOrEmail.set(
      'sameh@example.com',
    );
    (component as unknown as { message: { set: (v: string) => void } }).message.set(
      'استفسار بخصوص الحجز لـ 10 أفراد',
    );
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('.contact-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    // Antiforgery request
    http.expectOne('/api/security/csrf').flush({ requestToken: 'token-123' });

    // Contact submission request
    const req = http.expectOne('/api/contact');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('X-XSRF-TOKEN')).toBe('token-123');
    req.flush({ id: 'inq-1', createdAtUtc: '2026-11-16T10:00:00Z', success: true });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.form-alert--success')).not.toBeNull();
    http.verify();
  });
});
