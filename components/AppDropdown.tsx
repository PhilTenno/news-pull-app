// components/AppDropdown.tsx
import { StyleSheet, Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { theme } from '../styles/theme';

type DropdownItem = {
  id: string;
  label: string;
};

type AppDropdownProps = {
  label: string;
  placeholder: string;
  items: DropdownItem[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
};

export function AppDropdown({
  label,
  placeholder,
  items,
  selectedId,
  onSelectId,
}: AppDropdownProps) {
  const dropdownData = items.map((item) => ({
    label: item.label,
    value: item.id,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        itemTextStyle={styles.itemTextStyle}
        iconStyle={styles.iconStyle}
        data={dropdownData}
        //search
        maxHeight={500}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        searchPlaceholder="Suchen..."
        value={selectedId ?? ''}
        onChange={(item) => {onSelectId(item.value);}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  itemTextStyle: {
    fontSize:theme.fontSizes.sm,
  },
  dropdown: {
    height:40,
    borderColor:theme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical:6,
    backgroundColor: theme.colors.modalInput,
  },
  placeholderStyle: {
    fontSize: 12,
    color: theme.colors.modalPlaceholder,
  },
  selectedTextStyle: {
    fontSize: 14,
    color: theme.colors.text,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    borderRadius: 8,
  },
  iconStyle: {
    width: 20,
    height: 20,
  } 
});