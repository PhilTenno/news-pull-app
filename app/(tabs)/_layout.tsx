// app/(tabs)/_layout.tsx
import Colors from '@/constants/Colors';
import i18n from '@/utils/i18n';
import { FontAwesome6 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'dark';
  const tintColor = Colors[scheme].tint;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: '#556070', 
        tabBarStyle: {
          backgroundColor: '#23272E', 
          borderTopColor: '#333',
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#23272E', 
          borderBottomColor: '#333',
          borderBottomWidth: 1,
        },
        headerTintColor: tintColor, 
        headerTitleStyle: {
          fontWeight: '600',
          display:'flex',
          justifyContent:'center'
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="house" size={size} color={color} />
          ),
          title: i18n.t('tabs.home'),
        }}
      />
      <Tabs.Screen
        name="one"
        options={{
          title: i18n.t('tabs.articles'),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="file-lines" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: i18n.t('tabs.settings'),
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="gear" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}