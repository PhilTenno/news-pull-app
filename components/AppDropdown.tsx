// components/AppDropdown.tsx
import { StyleSheet, Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

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
        search
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        searchPlaceholder="Suchen..."
        value={selectedId ?? ''}
        onChange={(item) => {
          onSelectId(item.value);
        }}
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
    color: '#333',
    marginBottom: 6,
  },
  itemTextStyle: {
    fontSize:14,
  },
  dropdown: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  placeholderStyle: {
    fontSize: 12,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#333',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    borderRadius: 8,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
});