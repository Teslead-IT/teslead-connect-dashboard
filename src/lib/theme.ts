/**
 * Theme utilities and configuration
 */

export type Theme = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'app-theme';

/**
 * Get the current theme from localStorage
 */
export function getStoredTheme(): Theme | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            return stored;
        }
    } catch {
        // localStorage may be inaccessible in private browsing or iframe
    }
    return null;
}

/**
 * Store theme preference
 */
export function setStoredTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // Ignore quota/security errors
    }
}

/**
 * Get system theme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

/**
 * Apply theme to document (synchronizes both .dark class and data-theme attribute)
 */
export function applyTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

    if (effectiveTheme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
    } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
    }
}

/**
 * Initialize theme on page load (prevents flash of wrong theme)
 */
export function initializeTheme(): void {
    if (typeof window === 'undefined') return;

    try {
        const storedTheme = getStoredTheme();
        const theme = storedTheme || 'system';
        applyTheme(theme);
    } catch (error) {
        console.error('Failed to initialize theme:', error);
        applyTheme('system');
    }
}

/**
 * Listen for system theme changes
 */
export function watchSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void {
    if (typeof window === 'undefined') return () => { };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
        callback(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
}

/**
 * Inline script to run in <head> before React mounts to prevent flash of unstyled theme (FOUT)
 */
export const THEME_INIT_SCRIPT = `(function() {
    try {
        var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
        var isDark = stored === 'dark' || ((!stored || stored === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        var root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
        }
    } catch (e) {}
})();`;
