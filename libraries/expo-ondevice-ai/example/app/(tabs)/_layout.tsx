import {Tabs} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {Platform} from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerShown: true,
        headerStyle: {
          backgroundColor: Platform.OS === 'ios' ? '#F2F2F7' : '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Features',
          headerTitle: 'Locanara for Community',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="sparkles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="device"
        options={{
          title: 'Device',
          headerTitle: 'Device Info',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="phone-portrait" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
