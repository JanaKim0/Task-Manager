import { effect, inject, Injectable, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { SettingsService } from './settings.service';
import { APP_INFO } from './app-info';

/** Page names, keyed by the `title` set on each route. */
type TitleKey = 'workspaces' | 'workspace' | 'board';

/**
 * Routes carry a key instead of finished text, so the browser tab (and the
 * desktop window title later on) follows the chosen language.
 */
@Injectable({ providedIn: 'root' })
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly settings = inject(SettingsService);

  /** The current page's key, kept so the title can be rebuilt on demand. */
  private readonly currentKey = signal<TitleKey | null>(null);

  constructor() {
    super();
    // The router only calls updateTitle when navigating, so switching the
    // language mid-page would otherwise leave a stale tab name.
    effect(() => {
      const names = this.settings.t().titles;
      const key = this.currentKey();
      const page = key ? names[key] : null;
      this.title.setTitle(page ? `${page} — ${APP_INFO.name}` : APP_INFO.name);
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const key = this.buildTitle(snapshot) as TitleKey | undefined;
    this.currentKey.set(key ?? null);
  }
}
