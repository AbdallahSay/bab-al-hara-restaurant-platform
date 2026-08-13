import { InjectionToken } from '@angular/core';

export interface AppEnvironment {
  readonly production: boolean;
  readonly apiBaseUrl: string;
}

export const APP_ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT');
