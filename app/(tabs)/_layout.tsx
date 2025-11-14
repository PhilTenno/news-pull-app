// app/(tabs)/_layout.tsx
import Colors from '@/constants/Colors';
import { FontAwesome6 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: tintColor,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Start',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="house" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="one"
        options={{
          title: 'Artikel',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="file-lines" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Einstellungen',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="gear" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}