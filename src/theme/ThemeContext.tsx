import React, { createContext, useContext } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { theme, Theme } from './index';

interface ThemeContextValue extends Theme {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => Promise<void>;
}

const darkTheme: Theme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#121212',
    card: '#1E1E1E',
    text: '#F5F5F5',
    textSecondary: '#B3B3B3',
    border: '#383838',
  },
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useSettingsStore();
  const isDark = settings.theme === 'dark';
  const activeTheme = isDark ? darkTheme : theme;
  const toggleTheme = () => updateSettings({ theme: isDark ? 'light' : 'dark' });

  return (
    <ThemeContext.Provider value={{ ...activeTheme, theme: activeTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};