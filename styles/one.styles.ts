// styles/one.styles.ts
import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const oneStyles = StyleSheet.create({
  containerContent: {
    paddingBottom: 24,
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

  // Date buttons
  dateButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dateButtonText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    fontFamily: theme.fonts.regular,
  },

  // Editor container + inner style (Roboto enforced, remove focus outline)
  editorWrapper: {
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  editorContent: {
    height: 250,
    fontFamily: theme.fonts.regular,
    color: '#222',
    // try to remove platform focus glow
    outlineWidth: 0,
    borderWidth: 0,
  },

  // paragraph select - separate class for later tuning
  paragraphSelect: {
    minWidth: 120,
    marginRight: 8,
    fontFamily: theme.fonts.regular,
  },

  // Keywords / image / preview
  keywordsContainer: { marginBottom: 16 },
  imageWrapper: { marginBottom: 16 },
  imagePreview: { marginTop: 8 },
  imageStyle: {
    width: '100%',
    height: 180,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  imageAltInput: { marginTop: 8 },

  imageRemoveRow: { marginTop: 4, alignItems: 'flex-end' },

  // Save / publish rows
  saveRow: { marginTop: 0, alignItems: 'flex-end' },
  publishRow: { marginTop: 16, alignItems: 'flex-end' },

  // Publish overlay
  publishOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    marginHorizontal: 16,
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: { backgroundColor: '#fff', borderRadius: 8, padding: 12, maxHeight: '90%' },

  // SmallButton base (used statt inline)
  smallBase: { flexDirection: 'row', alignItems: 'center', borderRadius: 8 },
  smallPrimary: { backgroundColor: theme.colors.primary, paddingVertical: 8, paddingHorizontal: 10 },
  smallDanger: { backgroundColor: theme.colors.danger, paddingVertical: 6, paddingHorizontal: 10 },
  smallLink: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  smallTextLight: { color: '#fff', fontWeight: '600', fontFamily: theme.fonts.medium },
  smallTextLink: { color: theme.colors.primary, fontWeight: '600', fontFamily: theme.fonts.medium },
});