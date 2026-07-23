import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import WebViewScreen from './src/screens/WebViewScreen';
import CallScreen from './src/screens/CallScreen';

// ─── Suppress Daily.co meeting_join_hook crash ────────────────────────────────
// The company's Daily domain has meeting_join_hook set to an invalid URL ("0").
// The native SDK throws MalformedURLException which propagates as a JS error.
// We intercept it here before it can crash the app.
const _originalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
  if (
    error?.message?.includes('meeting_join_hook') ||
    error?.message?.includes('no protocol') ||
    error?.message?.includes('NativeRequest')
  ) {
    console.warn('[Suppressed] Daily hook error (non-fatal):', error?.message);
    return; // swallow — do NOT crash the app
  }
  _originalHandler(error, isFatal);
});
// ─────────────────────────────────────────────────────────────────────────────

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
