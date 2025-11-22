// app/_layout.tsx
import {
  Roboto_300Light,
  Roboto_300Light_Italic,
  Roboto_400Regular,
  Roboto_500Medium,
  useFonts,
} from '@expo-google-fonts/roboto';
import { Slot } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Roboto_300Light,
    Roboto_300Light_Italic,
    Roboto_400Regular,
    Roboto_500Medium,
  });

  if (!fontsLoaded) {
    return <View />; // kurz: nichts rendern bis Fonts geladen sind
  }

  return <Slot />; // expo-router rendert hier alle Routen/Tabs
}