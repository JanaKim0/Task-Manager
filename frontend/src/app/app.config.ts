import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
} from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { TranslatedTitleStrategy } from './core/title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // withComponentInputBinding feeds route parameters into component @Inputs
    provideRouter(routes, withComponentInputBinding()),
    // Without provideHttpClient, injecting HttpClient throws
    provideHttpClient(withFetch()),
    // Tab titles come from the dictionary instead of the route definition
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
  ],
};
