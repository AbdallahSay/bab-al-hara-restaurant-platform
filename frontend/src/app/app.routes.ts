import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./platform/foundation/foundation-page').then((component) => component.FoundationPage),
    title: 'Bab Al Hara | باب الحارة',
  },
  { path: '**', redirectTo: '' },
];
