// styles/globalStyles.ts
import { StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  u: {
    textDecorationLine:'underline',
  }
});