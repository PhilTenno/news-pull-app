// components/ui/ButtonStyles.ts
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { theme } from './theme';

export const buttonStyles = StyleSheet.create({
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#3d434f',
  },
  btnCancel: {
    backgroundColor: '#4a608c',
  },
  btnAdd: {
    backgroundColor: '#803475',
    borderColor: '#86537f',
  },
  btnEdit: {
    backgroundColor:'#225439',
    borderColor:'#3f7b5b',
  },
  btnPublish: {
    backgroundColor: '#803475',
    borderColor: '#86537f',
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
}) as Record<string, ViewStyle>;   // Index‑Signatur

export const buttonTextStyles = StyleSheet.create({
  btn:     { color: '#efefef', fontSize:12 ,fontWeight: '500',   textTransform:'uppercase',},
  btnAdd:   { fontWeight: '700' }
}) as Record<string, TextStyle>;   // Index‑Signatur

export const smallButton = StyleSheet.create({
  smallButtonBase: { flexDirection: 'row', alignItems: 'center', borderWidth:0,borderColor:'transparent' },
  smallButtonIconOnly: { color:'#fff',borderColor:'transparent'},
  smallButtonText: {borderColor:'red'},
  smallButtonLink: { fontWeight: '600', fontFamily: theme.fonts.regular, color: theme.colors.text,fontSize:10 },
})

