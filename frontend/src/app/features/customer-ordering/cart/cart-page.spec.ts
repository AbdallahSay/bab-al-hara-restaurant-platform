import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CustomerApiService } from '../customer-api.service';
import { CartPage } from './cart-page';
import { CartService } from './cart.service';

describe('CartPage', () => {
  let fixture: ComponentFixture<CartPage>;
  let cartService: CartService;
  let getRestaurantStatusMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    localStorage.clear();
    getRestaurantStatusMock = vi
      .fn()
      .mockReturnValue(of({ acceptingOrders: true, messageAr: null, messageEn: null }));

    await TestBed.configureTestingModule({
      imports: [CartPage],
      providers: [
        provideRouter([]),
        {
          provide: CustomerApiService,
          useValue: {
            getRestaurantStatus: getRestaurantStatusMock,
          },
        },
      ],
    }).compileComponents();

    cartService = TestBed.inject(CartService);
    cartService.clear();
  });

  it('renders empty cart state when no items exist', () => {
    fixture = TestBed.createComponent(CartPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty-cart')).toBeTruthy();
  });

  it('renders paused banner when acceptingOrders is false and keeps cart items intact', () => {
    getRestaurantStatusMock.mockReturnValue(
      of({
        acceptingOrders: false,
        messageAr: 'نعتذر، المطعم لا يستقبل طلبات جديدة حالياً',
        messageEn: 'Sorry, the restaurant is paused',
      }),
    );

    cartService.add({
      id: 'item-1',
      categoryId: 'cat-1',
      nameAr: 'حواوشي بلدي',
      nameEn: 'Baladi Hawawshi',
      descriptionAr: 'حواوشي مشوي',
      descriptionEn: 'Grilled hawawshi',
      price: 60,
      imageReference: '/images/hawawshi.webp',
      preparationMinutes: 10,
      isAvailable: true,
    });

    fixture = TestBed.createComponent(CartPage);
    fixture.detectChanges();

    // Check banner
    const banner = fixture.nativeElement.querySelector('.restaurant-paused-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('نعتذر، المطعم لا يستقبل طلبات جديدة حالياً');

    // Check cart lines exist and items remain intact
    const lines = fixture.nativeElement.querySelectorAll('.cart-line');
    expect(lines.length).toBe(1);
    expect(lines[0].textContent).toContain('حواوشي بلدي');
    expect(cartService.items().length).toBe(1);
  });
});
