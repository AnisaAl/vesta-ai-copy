import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ChatHistoryScreen from '../screens/ChatHistoryScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6366F1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Fashion Chat' }} 
      />
      <Stack.Screen 
        name="ChatHistory" 
        component={ChatHistoryScreen} 
        options={{ title: 'Chat History' }} 
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;