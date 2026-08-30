import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from './index';
import { useSettingsStore } from '../stores/settingsStore';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

// Provide default theme
const defaultContext: ThemeContextType = {
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { settings, updateSettings } = useSettingsStore();
  const [isDark, setIsDark] = useState(() => {
    // Initialize from system preference
    return systemColorScheme === 'dark';
  });

  useEffect(() => {
    // Update from settings if available
    if (settings && settings.theme) {
      setIsDark(settings.theme === 'dark');
    }
  }, [settings?.theme]);

  const toggleTheme = useCallback(async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    // Try to save to settings if available
    try {
      if (updateSettings) {
        await updateSettings({ theme: newIsDark ? 'dark' : 'light' });
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      // Still toggle theme even if saving fails
    }
  }, [isDark, updateSettings]);

  const theme = isDark ? darkTheme : lightTheme;

  const value = {
    theme,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  // Always return a valid context
  if (!context || !context.theme) {
    if (__DEV__) {
      console.warn('useTheme: ThemeContext is not available. Using default light theme.');
    }
    return defaultContext;
  }
  
  return context;
};

export const useIsDark = () => {
  const { isDark } = useTheme();
  return isDark;
};

// Helper hook to get theme colors safely
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

// Helper hook to get a specific color
export const useThemeColor = (colorKey: keyof typeof lightTheme.colors) => {
  const { theme } = useTheme();
  return theme.colors[colorKey] || lightTheme.colors[colorKey];
};