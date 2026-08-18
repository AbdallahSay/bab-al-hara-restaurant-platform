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
    canActivate: [() => import('./core/auth/staff.guards').then((m) => m.kitchenGuard)],
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
    canActivate: [() => import('./core/auth/staff.guards').then((m) => m.cashierGuard)],
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
    canActivate: [() => import('./core/auth/staff.guards').then((m) => m.driverGuard)],
    loadComponent: () =>
      import('./features/driver/driver-page').then((component) => component.DriverPage),
    title: 'Driver | Bab Al Hara',
  },
  {
    path: 'management/sign-in',
    loadComponent: () =>
      import('./features/management/management-sign-in-page/management-sign-in-page').then(
        (m) => m.ManagementSignInPage,
      ),
    title: 'Management Sign In | Bab Al Hara',
  },
  {
    path: 'management',
    canActivate: [
      () =>
        import('./features/management/management-auth.guard').then((m) => m.managementAuthGuard),
    ],
    loadComponent: () =>
      import('./features/management/management-hub-page/management-hub-page').then(
        (m) => m.ManagementHubPage,
      ),
    title: 'Management Hub | Bab Al Hara',
  },
  {
    path: 'management/menu',
    canActivate: [
      () =>
        import('./features/management/management-auth.guard').then((m) => m.managementAuthGuard),
    ],
    loadComponent: () =>
      import('./features/management/management-menu-page/management-menu-page').then(
        (m) => m.ManagementMenuPage,
      ),
    title: 'Menu Management | Bab Al Hara',
  },
  {
    path: 'management/operations',
    canActivate: [
      () =>
        import('./features/management/management-auth.guard').then((m) => m.managementAuthGuard),
    ],
    loadComponent: () =>
      import('./features/management/operations-command-center-page/operations-command-center-page').then(
        (m) => m.OperationsCommandCenterPage,
      ),
    title: 'Operations Command Center | Bab Al Hara',
  },
  { path: '**', redirectTo: '' },
];
