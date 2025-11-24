// styles/globalStyles.ts
import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const globalStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  screenTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  section: {
    marginTop:40
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 10,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  labelSmall: {
    fontSize: theme.fontSizes.xs,
    marginRight:6,
    fontWeight:'300',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
  },

  // Utilities
  flexRow: {
    flexDirection: 'row',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedText: {
    color: theme.colors.muted,
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.regular,
  },
  spacerSmall: {
    height: theme.spacing.xs,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.md,
  },

  // centered screen helper for loading states
  centeredScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});