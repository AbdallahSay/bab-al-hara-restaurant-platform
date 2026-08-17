import { TestBed } from '@angular/core/testing';
import { of, throwError, firstValueFrom } from 'rxjs';

import { LanguageService } from '../../core/i18n/language.service';
import { CustomerApiService } from './customer-api.service';
import { RestaurantStatusService } from './restaurant-status.service';

describe('RestaurantStatusService', () => {
  let service: RestaurantStatusService;
  let languageService: LanguageService;
  let getRestaurantStatusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getRestaurantStatusMock = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        RestaurantStatusService,
        LanguageService,
        {
          provide: CustomerApiService,
          useValue: {
            getRestaurantStatus: getRestaurantStatusMock,
          },
        },
      ],
    });

    service = TestBed.inject(RestaurantStatusService);
    languageService = TestBed.inject(LanguageService);
  });

  it('initializes with null status and isPaused false', () => {
    expect(service.status()).toBeNull();
    expect(service.isPaused()).toBe(false);
  });

  it('loads status successfully and updates signals', async () => {
    getRestaurantStatusMock.mockReturnValue(
      of({
        acceptingOrders: false,
        messageAr: 'نعتذر، المطعم مغلق للصيانة',
        messageEn: 'Sorry, the restaurant is closed for maintenance',
      }),
    );

    const res = await firstValueFrom(service.loadStatus());
    expect(res.acceptingOrders).toBe(false);
    expect(service.status()?.acceptingOrders).toBe(false);
    expect(service.isPaused()).toBe(true);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBe(false);
  });

  it('renders custom and fallback pause messages in AR and EN', () => {
    // 1. Custom message in AR
    languageService.setLanguage('ar');
    service.status.set({
      acceptingOrders: false,
      messageAr: 'رسالة إيقاف مخصصة بالعربي',
      messageEn: 'Custom English pause message',
    });
    expect(service.pauseMessage()).toBe('رسالة إيقاف مخصصة بالعربي');

    // 2. Custom message in EN
    languageService.setLanguage('en');
    expect(service.pauseMessage()).toBe('Custom English pause message');

    // 3. Fallback when custom messages are null
    service.status.set({
      acceptingOrders: false,
      messageAr: null,
      messageEn: null,
    });
    languageService.setLanguage('ar');
    expect(service.pauseMessage()).toBe('المطعم لا يستقبل طلبات جديدة مؤقتًا');

    languageService.setLanguage('en');
    expect(service.pauseMessage()).toBe('The restaurant is temporarily paused for new orders');
  });

  it('handles manual paused state update', () => {
    service.setPausedManually('مغلق', 'Closed');
    expect(service.isPaused()).toBe(true);
    expect(service.status()?.messageAr).toBe('مغلق');
    expect(service.status()?.messageEn).toBe('Closed');
  });

  it('handles load error gracefully with fallback', async () => {
    getRestaurantStatusMock.mockReturnValue(throwError(() => new Error('Network error')));

    const res = await firstValueFrom(service.loadStatus());
    expect(res.acceptingOrders).toBe(true);
    expect(service.error()).toBe(true);
    expect(service.loading()).toBe(false);
  });
});
