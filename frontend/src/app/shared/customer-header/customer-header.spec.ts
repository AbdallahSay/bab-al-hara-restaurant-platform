import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { LanguageService } from '../../core/i18n/language.service';
import { RecentOrdersService } from '../../features/customer-ordering/recent-orders.service';
import { CustomerHeader } from './customer-header';

describe('CustomerHeader', () => {
  let fixture: ComponentFixture<CustomerHeader>;
  let component: CustomerHeader;
  let recentOrdersService: RecentOrdersService;
  let languageService: LanguageService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [CustomerHeader],
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

    recentOrdersService = TestBed.inject(RecentOrdersService);
    languageService = TestBed.inject(LanguageService);
    languageService.setLanguage('ar');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders My Orders link in Arabic', () => {
    fixture = TestBed.createComponent(CustomerHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    const ordersLink = compiled.querySelector('.orders-link');
    expect(ordersLink).toBeTruthy();
    expect(ordersLink?.textContent).toContain('طلباتي');
  });

  it('renders My Orders link in English', () => {
    languageService.setLanguage('en');
    fixture = TestBed.createComponent(CustomerHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const ordersLink = compiled.querySelector('.orders-link');
    expect(ordersLink).toBeTruthy();
    expect(ordersLink?.textContent).toContain('My Orders');
  });

  it('does not render active order link when activeOrderCode is null', () => {
    fixture = TestBed.createComponent(CustomerHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.active-order-link')).toBeFalsy();
  });

  it('renders contextual active order link when activeOrderCode is present', () => {
    recentOrdersService.setActiveOrderCode('ORD-ACTIVE-99');

    fixture = TestBed.createComponent(CustomerHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const activeLink = compiled.querySelector('.active-order-link') as HTMLAnchorElement;
    expect(activeLink).toBeTruthy();
    expect(activeLink.textContent).toContain('متابعة طلبك');
  });

  it('switches language when language button is clicked', () => {
    fixture = TestBed.createComponent(CustomerHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const enBtn = compiled.querySelector('button[data-language="en"]') as HTMLButtonElement;
    enBtn.click();
    fixture.detectChanges();

    expect(languageService.current()).toBe('en');
    expect(compiled.querySelector('.orders-link')?.textContent).toContain('My Orders');
  });
});
