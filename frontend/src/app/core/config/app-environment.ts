import { InjectionToken } from '@angular/core';

export interface AppEnvironment {
  readonly production: boolean;
  readonly apiBaseUrl: string;
  readonly kitchenHubUrl: string;
  readonly cashierHubUrl: string;
  readonly driverHubUrl: string;
  readonly operationsHubUrl: string;
}

export const APP_ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT');
