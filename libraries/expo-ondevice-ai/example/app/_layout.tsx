import {useEffect, useState} from 'react';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {AppStateProvider} from '../components/AppState';

export default function RootLayout() {
  return (
    <AppStateProvider>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="feature/[id]"
          options={{
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="framework/[id]"
          options={{
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
    </AppStateProvider>
  );
}
