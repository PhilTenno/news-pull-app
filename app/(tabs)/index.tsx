// app/(tabs)/index.tsx
import { globalStyles } from '@/styles/globalStyles'; // alias `@` muss in tsconfig.json / babel.config.js definiert sein
import { Image, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={globalStyles.startContainer}>
      {/* Bild aus assets/images/icon.png */}
      <Image
        source={require('@/assets/images/mainImage.png')}   // ← 1️⃣
        style={styles.icon}
        resizeMode="contain"                       
      />
      <Text style={globalStyles.mainTitle}>Filling Contao News with Life</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 240,          // gewünschte Breite
    height: 240,         // gewünschte Höhe
    marginBottom: 20,
  },
});