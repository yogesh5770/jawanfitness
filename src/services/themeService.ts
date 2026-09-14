export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'jawan_app_theme_v1';

class ThemeService {
  private currentTheme: ThemeMode = 'dark';
  private listeners: Set<(theme: ThemeMode) => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    // Check localStorage or system preference
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') {
      this.currentTheme = saved;
    } else {
      // Default to dark for elite gym aesthetic
      this.currentTheme = 'dark';
    }
    this.applyTheme();
  }

  public getTheme(): ThemeMode {
    return this.currentTheme;
  }

  public setTheme(theme: ThemeMode) {
    this.currentTheme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    this.applyTheme();
    this.notify();
  }

  public toggleTheme(): ThemeMode {
    const next = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  public subscribe(listener: (theme: ThemeMode) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentTheme));
  }

  private applyTheme() {
    const root = document.documentElement;
    if (this.currentTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }
}

export const themeService = new ThemeService();
