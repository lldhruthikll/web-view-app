import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import WebViewScreen from './src/screens/WebViewScreen';
import CallScreen from './src/screens/CallScreen';

export type RootStackParamList = {
  WebView: undefined;
  Call: {
    roomUrl: string;
    roomName: string;
    token: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="WebView"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0b0f19' },
        }}
      >
        <Stack.Screen name="WebView" component={WebViewScreen} />
        <Stack.Screen name="Call" component={CallScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
