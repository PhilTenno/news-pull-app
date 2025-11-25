// styles/theme.ts
export const theme = {
  colors: {
    background: '#23272E',
    surface: '#23272E',
    text: '#efefef',
    muted: '#efefef',
    border: '#556070',
    modalColor: '#efefef',
    modalInput: 'rgba(255,255,255,0.1)',
    modalPlaceholder: '#efefef',
    noContentTextColor: '#db5555'
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