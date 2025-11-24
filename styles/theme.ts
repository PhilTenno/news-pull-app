// styles/theme.ts
export const theme = {
  colors: {
    background: '#f7f8fa',
    surface: '#ffffff',
    primary: '#0a7ea4',
    primaryDark: '#07627f',
    danger: '#e74c3c',
    text: '#222222',
    muted: '#666666',
    border: '#e0e0e0',
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radii: {
    sm: 4,
    md: 6,
    lg: 8,
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
  },
  fonts: {
    // Diese Schlüssel entsprechen den Namen, die expo-google-fonts bereitstellt
    light: 'Roboto_300Light',
    lightItalic: 'Roboto_300Light_Italic',
    regular: 'Roboto_400Regular',
    medium: 'Roboto_500Medium',
  },
};
export type Theme = typeof theme;