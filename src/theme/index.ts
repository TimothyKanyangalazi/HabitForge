import { lightColors, darkColors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export const lightTheme = {
  colors: lightColors,
  spacing,
  typography,
  dark: false,
};

export const darkTheme = {
  colors: darkColors,
  spacing,
  typography,
  dark: true,
};

export type Theme = typeof lightTheme;
export type ThemeColors = typeof lightColors;