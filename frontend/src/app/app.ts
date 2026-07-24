import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog';
import { SettingsService, Theme } from './core/settings.service';
import { Language, LANGUAGES } from './core/i18n';
import { APP_INFO } from './core/app-info';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ConfirmDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly settings = inject(SettingsService);

  protected readonly appName = APP_INFO.name;
  protected readonly info = APP_INFO;
  protected readonly currentYear = new Date().getFullYear();

  protected readonly t = this.settings.t;
  protected readonly language = this.settings.language;
  protected readonly theme = this.settings.theme;
  protected readonly languages = LANGUAGES;
  protected readonly themes: Theme[] = ['pink', 'gray'];

  // Board pages need the full window width; everything else stays centred.
  protected readonly wideLayout = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) =>
        this.wideLayout.set(event.urlAfterRedirects.startsWith('/boards/')),
      );
  }

  protected setLanguage(language: Language): void {
    this.settings.setLanguage(language);
  }

  protected setTheme(theme: Theme): void {
    this.settings.setTheme(theme);
  }

  protected themeLabel(theme: Theme): string {
    return theme === 'pink' ? this.t().theme.pink : this.t().theme.gray;
  }
}
