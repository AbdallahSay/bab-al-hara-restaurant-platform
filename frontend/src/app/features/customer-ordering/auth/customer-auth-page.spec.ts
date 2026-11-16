import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { APP_ENVIRONMENT } from '../../../core/config/app-environment';
import { CustomerAuthPage } from './customer-auth-page';

describe('CustomerAuthPage', () => {
  it('renders split auth card and tab toggle cleanly', async () => {
    globalThis.localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [CustomerAuthPage],
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

    const fixture: ComponentFixture<CustomerAuthPage> = TestBed.createComponent(CustomerAuthPage);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    // Handle initial session check
    http.expectOne('/api/customer/auth/session').flush({
      isAuthenticated: false,
      id: null,
      fullName: null,
      email: null,
      phoneNumber: null,
    });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.auth-brand-side')).not.toBeNull();
    expect(compiled.querySelector('.auth-card')).not.toBeNull();
    expect(compiled.querySelectorAll('.tab-btn').length).toBe(2);
    expect(compiled.querySelector('.button--guest')).not.toBeNull();
    http.verify();
  });

  it('submits real sign-in to backend and displays success notice upon server confirmation', async () => {
    globalThis.localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [CustomerAuthPage],
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

    const fixture: ComponentFixture<CustomerAuthPage> = TestBed.createComponent(CustomerAuthPage);
    const component = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http.expectOne('/api/customer/auth/session').flush({
      isAuthenticated: false,
      id: null,
      fullName: null,
      email: null,
      phoneNumber: null,
    });

    // Enter sign-in credentials
    (component as unknown as { identifier: { set: (v: string) => void } }).identifier.set(
      'customer@example.com',
    );
    (component as unknown as { password: { set: (v: string) => void } }).password.set('Pass123!@#');
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('.auth-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    http.expectOne('/api/security/csrf').flush({ requestToken: 'csrf-auth' });

    const signInReq = http.expectOne('/api/customer/auth/sign-in');
    expect(signInReq.request.method).toBe('POST');
    expect(signInReq.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-auth');
    signInReq.flush({
      isAuthenticated: true,
      id: 'cust-1',
      fullName: 'أحمد علي',
      email: 'customer@example.com',
      phoneNumber: null,
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.auth-alert--success')).not.toBeNull();
    http.verify();
  });

  it('displays real backend error message when sign-in fails', async () => {
    globalThis.localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [CustomerAuthPage],
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

    const fixture: ComponentFixture<CustomerAuthPage> = TestBed.createComponent(CustomerAuthPage);
    const component = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http.expectOne('/api/customer/auth/session').flush({
      isAuthenticated: false,
      id: null,
      fullName: null,
      email: null,
      phoneNumber: null,
    });

    (component as unknown as { identifier: { set: (v: string) => void } }).identifier.set(
      'customer@example.com',
    );
    (component as unknown as { password: { set: (v: string) => void } }).password.set(
      'WrongPassword',
    );
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('.auth-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    http.expectOne('/api/security/csrf').flush({ requestToken: 'csrf-auth' });

    const signInReq = http.expectOne('/api/customer/auth/sign-in');
    signInReq.flush(
      { detail: 'بيانات الدخول غير صحيحة.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.auth-alert--error')).not.toBeNull();
    expect(compiled.querySelector('.auth-alert--error')?.textContent).toContain(
      'بيانات الدخول غير صحيحة.',
    );
    http.verify();
  });
});
