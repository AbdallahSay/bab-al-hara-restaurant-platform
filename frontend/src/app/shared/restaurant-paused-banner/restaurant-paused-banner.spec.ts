import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { LanguageService } from '../../core/i18n/language.service';
import { RestaurantStatusService } from '../../features/customer-ordering/restaurant-status.service';
import { RestaurantPausedBanner } from './restaurant-paused-banner';

describe('RestaurantPausedBanner', () => {
  let fixture: ComponentFixture<RestaurantPausedBanner>;
  let statusService: RestaurantStatusService;
  let languageService: LanguageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantPausedBanner],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: APP_ENVIRONMENT,
          useValue: { production: false, apiBaseUrl: '/api', kitchenHubUrl: '/hubs/kitchen' },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RestaurantPausedBanner);
    statusService = TestBed.inject(RestaurantStatusService);
    languageService = TestBed.inject(LanguageService);
  });

  it('does not render banner when accepting orders', () => {
    statusService.status.set({ acceptingOrders: true, messageAr: null, messageEn: null });
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.restaurant-paused-banner');
    expect(banner).toBeNull();
  });

  it('renders banner with default Arabic fallback message when paused', () => {
    languageService.setLanguage('ar');
    statusService.status.set({ acceptingOrders: false, messageAr: null, messageEn: null });
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.restaurant-paused-banner');
    expect(banner).not.toBeNull();
    const title = fixture.nativeElement.querySelector('.banner-title');
    expect(title.textContent).toContain('المطعم لا يستقبل طلبات جديدة مؤقتًا');
  });

  it('renders banner with default English fallback message when paused in English', () => {
    languageService.setLanguage('en');
    statusService.status.set({ acceptingOrders: false, messageAr: null, messageEn: null });
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.banner-title');
    expect(title.textContent).toContain('The restaurant is temporarily paused for new orders');
  });

  it('renders banner with custom pause message when provided', () => {
    languageService.setLanguage('ar');
    statusService.status.set({
      acceptingOrders: false,
      messageAr: 'نعتذر عن استقبال الطلبات بسبب ضغط العمل',
      messageEn: 'Sorry, we are temporarily paused due to rush hour',
    });
    fixture.detectChanges();
    const titleAr = fixture.nativeElement.querySelector('.banner-title');
    expect(titleAr.textContent).toContain('نعتذر عن استقبال الطلبات بسبب ضغط العمل');

    languageService.setLanguage('en');
    fixture.detectChanges();
    const titleEn = fixture.nativeElement.querySelector('.banner-title');
    expect(titleEn.textContent).toContain('Sorry, we are temporarily paused due to rush hour');
  });
});
