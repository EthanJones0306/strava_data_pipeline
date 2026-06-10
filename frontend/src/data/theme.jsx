import { createContext, useContext, useState, useEffect } from 'react';

const THEME_KEY = 'strava-dashboard-theme';

export const themes = {
  orange: {
    name: 'orange',
    label: 'Strava Orange',
    accent: '#FC4C02',
    accentDark: '#E03E01',
    accentLight: '#FF6B2B',
  },
  purple: {
    name: 'purple',
    label: 'Purple',
    accent: '#A855F7',
    accentDark: '#8B35E0',
    accentLight: '#C084FC',
  },
  red: {
    name: 'red',
    label: 'Red',
    accent: '#EF4444',
    accentDark: '#DC2626',
    accentLight: '#F87171',
  },
  green: {
    name: 'green',
    label: 'Green',
    accent: '#22C55E',
    accentDark: '#16A34A',
    accentLight: '#4ADE80',
  },
  blue: {
    name: 'blue',
    label: 'Blue',
    accent: '#3B82F6',
    accentDark: '#2563EB',
    accentLight: '#60A5FA',
  },
  pink: {
    name: 'pink',
    label: 'Pink',
    accent: '#EC4899',
    accentDark: '#DB2777',
    accentLight: '#F472B6',
  },
  teal: {
    name: 'teal',
    label: 'Teal',
    accent: '#14B8A6',
    accentDark: '#0D9488',
    accentLight: '#2DD4BF',
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved && themes[saved]) return saved;
    } catch {}
    return 'orange';
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = (name) => setThemeState(name);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, current: themes[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
