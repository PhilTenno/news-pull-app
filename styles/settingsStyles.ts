// styles/settingsStyles.ts
import { StyleSheet } from 'react-native';

export const settingsStyles = StyleSheet.create({
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  archiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  archiveName: {
    fontSize: 16,
    fontWeight: '600',
  },
  archiveDetailMasked: {
    fontSize: 12,
    color: '#999',
  },
  pickerContainer: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 6,
      backgroundColor: '#fff',
      marginBottom: 12,
    },  
  removeButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#e74c3c',
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonRow: {
    marginTop: 12,
  },
});