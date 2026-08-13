import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/customer-ordering/menu/menu-page').then((component) => component.MenuPage),
    title: 'Bab Al Hara | باب الحارة',
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./features/customer-ordering/cart/cart-page').then((component) => component.CartPage),
    title: 'Cart | Bab Al Hara',
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/customer-ordering/checkout/checkout-page').then(
        (component) => component.CheckoutPage,
      ),
    title: 'Checkout | Bab Al Hara',
  },
  {
    path: 'order-confirmed',
    loadComponent: () =>
      import('./features/customer-ordering/success/order-success-page').then(
        (component) => component.OrderSuccessPage,
      ),
    title: 'Order confirmed | Bab Al Hara',
  },
  {
    path: 'kitchen/sign-in',
    loadComponent: () =>
      import('./features/kitchen/staff-sign-in-page').then(
        (component) => component.StaffSignInPage,
      ),
    title: 'Kitchen sign in | Bab Al Hara',
  },
  {
    path: 'kitchen',
    loadComponent: () =>
      import('./features/kitchen/kitchen-page').then((component) => component.KitchenPage),
    title: 'Kitchen | Bab Al Hara',
  },
  { path: '**', redirectTo: '' },
];
