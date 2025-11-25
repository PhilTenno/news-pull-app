// styles/one.styles.ts
import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const oneStyles = StyleSheet.create({
  containerContent: {
    paddingBottom: 24,
  },

  // Editor container + inner style (Roboto enforced, remove focus outline)
  editorWrapper: {
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 6,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  editorContent: {
    height: 250,
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
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
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },

});