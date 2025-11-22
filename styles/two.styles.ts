// styles/two.styles.ts
import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const twoStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fonts.regular,
  },
  buttonRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0, // placeholder, gap isn't supported — spacing applied on buttons
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
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
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
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.sm,
    marginLeft: 0,
  },
  linkText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
    // fontFamily: theme.fonts.medium,
  },
  topLinkButton: {
    marginRight: 8,
  },
  // ensure actionButton spacing exists
  actionButtonSpacing: {
    width: theme.spacing.xs,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    // fontFamily: theme.fonts.medium,
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.danger,
    borderRadius: theme.radii.sm,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: theme.fontSizes.xs,
    fontWeight: '600',
    fontFamily: theme.fonts.medium,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.sm,
    maxHeight: '90%',
  },
  modalTitle: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.md,
    marginBottom: theme.spacing.xs,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.xs,
  },
  modalButtonRightGap: {
    marginRight: theme.spacing.sm,
  },

  smallTextMuted: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular,
  },
});