import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import 'react-native-gesture-handler';

// Import our navigation
import AppNavigator from './navigation/AppNavigator';

// Create our custom theme based on the web app's theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366F1', // Indigo color that matches our web theme
    background: '#FFFFFF',
    surface: '#FFFFFF',
    accent: '#8B5CF6',
    error: '#EF4444',
  },
  roundness: 8,
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}