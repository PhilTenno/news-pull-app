// app/(tabs)/index.tsx
import { globalStyles } from '@/styles/globalStyles'; // alias `@` muss in tsconfig.json / babel.config.js definiert sein
import { FontAwesome6 } from '@expo/vector-icons';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {

  const infoLink = () => Linking.openURL('https://newspull.pixeltenno.de');
  const hbrLink = () => Linking.openURL('https://hardbitrocker.de');

  return (
    <View style={[globalStyles.startContainer,{position:'relative'}]}>
      {/* Bild aus assets/images/icon.png */}
      <Image
        source={require('@/assets/images/mainImage.png')}   // ← 1️⃣
        style={styles.icon}
        resizeMode="contain"                       
      />
      <Text style={[globalStyles.mainTitle, { textAlign: 'center' }]}>Filling Contao with Life</Text>
      <Pressable onPress={infoLink} style={{ alignItems: 'center' }}>
        <FontAwesome6 name="circle-info" size={14} color="#999" />
      </Pressable>
      <View style={styles.linkStyleView}>
        <Text style={styles.linkStyleText}>
          made with ❤️ by{' '}
          <Text style={styles.linkStyle} onPress={hbrLink}>
            Hardbitrocker
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 240,          // gewünschte Breite
    height: 240,         // gewünschte Höhe
    marginBottom: 20,
  },
  linkStyleView: {
    position:'absolute',
    bottom:30
  },
  linkStyleText: {
    fontSize:12,
    color: '#999',
  },
  linkStyle: {
    color: '#efefef',
  }
});

