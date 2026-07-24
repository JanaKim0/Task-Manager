import { computed, effect, Injectable, signal } from '@angular/core';
import { DATE_LOCALES, DICTIONARIES, Language } from './i18n';

export type Theme = 'pink' | 'gray';

const LANGUAGE_KEY = 'tm.language';
const THEME_KEY = 'tm.theme';

/**
 * Language and colour theme, remembered in localStorage so the app opens
 * the way it was left.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly language = signal<Language>(this.readLanguage());
  readonly theme = signal<Theme>(this.readTheme());

  /**
   * The active dictionary. Templates read it as `t().board.addCard`, and
   * because it is a computed signal every label re-renders the moment the
   * language changes — no page reload.
   */
  readonly t = computed(() => DICTIONARIES[this.language()]);

  /** Locale for toLocaleDateString, following the chosen language. */
  readonly dateLocale = computed(() => DATE_LOCALES[this.language()]);

  constructor() {
    // Writes the choices back to localStorage and puts the theme on <html>,
    // where the CSS variables are declared.
    effect(() => {
      const language = this.language();
      const theme = this.theme();

      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.setAttribute('lang', language);

      try {
        localStorage.setItem(LANGUAGE_KEY, language);
        localStorage.setItem(THEME_KEY, theme);
      } catch {
        // Private-browsing mode can refuse storage; the app still works,
        // it just forgets the choice after a reload.
      }
    });
  }

  setLanguage(language: Language): void {
    this.language.set(language);
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  /** Falls back to the browser's language on a first visit. */
  private readLanguage(): Language {
    const stored = this.read(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'ru') {
      return stored;
    }
    return navigator.language?.startsWith('ru') ? 'ru' : 'en';
  }

  private readTheme(): Theme {
    return this.read(THEME_KEY) === 'gray' ? 'gray' : 'pink';
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
}
