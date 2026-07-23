import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // withComponentInputBinding — параметры маршрута попадают в @Input компонента
    provideRouter(routes, withComponentInputBinding()),
    // Без provideHttpClient инъекция HttpClient упадёт с ошибкой
    provideHttpClient(withFetch()),
  ],
};
