// app/(tabs)/index.tsx
import { globalStyles } from '@/styles/globalStyles';
import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={globalStyles.screenContainer}>
      <Text style={globalStyles.screenTitle}>News-Pull App</Text>
      <Text>Hallo Welt</Text>
    </View>
  );
}