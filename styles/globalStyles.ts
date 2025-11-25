// styles/globalStyles.ts
import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const globalStyles = StyleSheet.create({
  startContainer: {
    display:'flex',
    flexDirection:'column',
    alignItems:'center',
    justifyContent:'center',
    width:'100%',
    height:'100%',
    backgroundColor: theme.colors.background,
  },
  mainTitle: {
    fontSize: theme.fontSizes.xs,
    fontWeight: '300',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
  },
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
  scrollContent: {
    paddingBottom: theme.spacing.lg,
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
  //Text
  noContentTextColor: {
    color: theme.colors.noContentTextColor,
    marginBlockEnd:20,
  },

  // Forms
  label: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
    marginBottom: 5,
    marginTop: 10,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  labelSmall: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text,
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
  buttonRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0, 
  },
  
  emptyText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fonts.regular,
  },

  // Grid / rows
  row: { flexDirection: 'row', marginBottom: 8 },
  column: { flex: 1 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowEnd: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },

  // centered screen helper for loading states
  centeredScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  //Modal Overlay
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.sm,
    maxHeight: '90%',
    borderWidth:1,
    borderColor:'rgba(255,255,255,0.2)'
  },

  modalTitle: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.md,
    marginBottom: theme.spacing.xs,
    color: theme.colors.modalColor,
  },
  modalLabel: {
    color: theme.colors.modalColor,
    marginBlock:10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: theme.colors.modalInput,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,    
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 30,
  },
  modalButtonRightGap: {
    marginRight: theme.spacing.sm,
  },
});