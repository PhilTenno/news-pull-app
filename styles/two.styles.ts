// styles/two.styles.ts
import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const twoStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  websiteItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  websiteName: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  websiteUrl: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular,
  },

  // Archives list
  archiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  archiveMain: {
    flex: 1,
  },
  archiveName: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '700',
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  archiveDetailMasked: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular,
  },
  archiveActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallTextMuted: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular,
  },
});