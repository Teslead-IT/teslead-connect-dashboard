'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    type Theme,
    getStoredTheme,
    setStoredTheme,
    applyTheme,
    getSystemTheme,
    watchSystemTheme,
} from '@/lib/theme';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    effectiveTheme: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system');
    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = getStoredTheme();
        const initialTheme: Theme = stored || 'system';
        setThemeState(initialTheme);
        const effective = initialTheme === 'system' ? getSystemTheme() : initialTheme;
        setEffectiveTheme(effective);
        applyTheme(initialTheme);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const unwatch = watchSystemTheme((systemTheme) => {
            if (theme === 'system') {
                setEffectiveTheme(systemTheme);
                applyTheme('system');
            }
        });

        return unwatch;
    }, [theme, mounted]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        setStoredTheme(newTheme);
        const effective = newTheme === 'system' ? getSystemTheme() : newTheme;
        setEffectiveTheme(effective);
        applyTheme(newTheme);
    };

    const toggleTheme = () => {
        const next: Theme = effectiveTheme === 'dark' ? 'light' : 'dark';
        setTheme(next);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
