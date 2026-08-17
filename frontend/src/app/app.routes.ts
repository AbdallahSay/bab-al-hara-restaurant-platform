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
    path: 'order/:publicCode/track',
    loadComponent: () =>
      import('./features/order-tracking/order-tracking-page').then((m) => m.OrderTrackingPage),
    title: 'Track your order | Bab Al Hara',
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
  {
    path: 'cashier/sign-in',
    loadComponent: () =>
      import('./features/cashier/cashier-sign-in-page').then((m) => m.CashierSignInPage),
    title: 'Cashier sign in | Bab Al Hara',
  },
  {
    path: 'cashier',
    loadComponent: () => import('./features/cashier/cashier-page').then((m) => m.CashierPage),
    title: 'Cashier | Bab Al Hara',
  },
  {
    path: 'driver/sign-in',
    loadComponent: () =>
      import('./features/driver/driver-sign-in-page').then(
        (component) => component.DriverSignInPage,
      ),
    title: 'Driver sign in | Bab Al Hara',
  },
  {
    path: 'driver',
    loadComponent: () =>
      import('./features/driver/driver-page').then((component) => component.DriverPage),
    title: 'Driver | Bab Al Hara',
  },
  { path: '**', redirectTo: '' },
];
