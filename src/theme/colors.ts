export const lightColors = {
  primary: '#4A90E2',
  secondary: '#50C878',
  background: '#FFFFFF',
  card: '#F5F5F5',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E0E0E0',
  danger: '#E74C3C',
  success: '#2ECC71',
  warning: '#F39C12',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const darkColors = {
  primary: '#5B7CFA',
  secondary: '#28B67A',
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  border: '#333333',
  danger: '#F05D5E',
  success: '#28B67A',
  warning: '#F4A340',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type LightColors = typeof lightColors;
export type DarkColors = typeof darkColors;