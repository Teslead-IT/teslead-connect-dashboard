/**
 * Theme utilities and configuration
 */

export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'app-theme';

/**
 * Get the current theme from localStorage
 */
export function getStoredTheme(): Theme | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
    }
    return null;
}

/**
 * Store theme preference
 */
export function setStoredTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Get system theme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

    // Remove both classes first
    root.removeAttribute('data-theme');

    // Apply the effective theme
    if (effectiveTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
    }
}

/**
 * Initialize theme on page load (prevents flash of wrong theme)
 */
export function initializeTheme(): void {
    if (typeof window === 'undefined') return;

    try {
        const storedTheme = getStoredTheme();
        const theme = storedTheme || 'dark'; // Default to dark
        applyTheme(theme);
    } catch (error) {
        console.error('Failed to initialize theme:', error);
        applyTheme('dark');
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
