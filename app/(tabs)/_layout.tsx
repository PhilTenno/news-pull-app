import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'blue', // später können wir das anpassen
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Artikel',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="file-text-o" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Einstellungen',
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="cog" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}