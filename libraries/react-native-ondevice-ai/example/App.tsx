import React from 'react';
import {StatusBar, Platform} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {AppStateProvider} from './src/components/AppState';
import FeaturesScreen from './src/screens/FeaturesScreen';
import FrameworkScreen from './src/screens/FrameworkScreen';
import DeviceScreen from './src/screens/DeviceScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FeatureDetailScreen from './src/screens/FeatureDetailScreen';
import FrameworkDetailScreen from './src/screens/FrameworkDetailScreen';

export type RootStackParamList = {
  Tabs: undefined;
  FeatureDetail: {id: string; name: string};
  FrameworkDetail: {id: string; name: string};
};

export type TabParamList = {
  Features: undefined;
  Framework: undefined;
  Device: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerStyle: {
          backgroundColor: Platform.OS === 'ios' ? '#F2F2F7' : '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}>
      <Tab.Screen
        name="Features"
        component={FeaturesScreen}
        options={{
          headerTitle: 'Locanara',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="sparkles" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Framework"
        component={FrameworkScreen}
        options={{
          headerTitle: 'Framework',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Device"
        component={DeviceScreen}
        options={{
          headerTitle: 'Device Info',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="phone-portrait" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Tabs"
              component={TabNavigator}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="FeatureDetail"
              component={FeatureDetailScreen}
              options={({route}) => ({
                title: route.params.name,
                headerBackTitle: 'Back',
              })}
            />
            <Stack.Screen
              name="FrameworkDetail"
              component={FrameworkDetailScreen}
              options={({route}) => ({
                title: route.params.name,
                headerBackTitle: 'Back',
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

export default App;
