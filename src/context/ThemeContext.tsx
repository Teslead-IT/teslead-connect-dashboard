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
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = getStoredTheme();
        const initialTheme = stored || 'dark';
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

    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
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
