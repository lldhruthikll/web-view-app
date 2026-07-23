import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import WebViewScreen from './src/screens/WebViewScreen';
import CallScreen from './src/screens/CallScreen';

// ─── Suppress Daily.co warnings from UI ────────────────────────────────
LogBox.ignoreLogs([
  'meeting_join_hook',
  'no protocol: 0',
  'NativeRequest',
  'Daily',
  'advanced_firewall_control',
]);

// ─── Suppress Daily.co unhandled rejections from crashing app ─────────
const _originalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
  const msg = error?.message || String(error || '');
  console.warn('[GlobalErrorHandler] Error:', msg, 'isFatal:', isFatal);

  // Swallow all Daily.co, WebRTC, and networking background warnings
  if (
    msg.includes('meeting_join_hook') ||
    msg.includes('no protocol') ||
    msg.includes('NativeRequest') ||
    msg.includes('Daily') ||
    msg.includes('webrtc') ||
    msg.includes('WebSocket') ||
    msg.includes('MediaDevices')
  ) {
    console.warn('[Suppressed] Intercepted non-fatal background error:', msg);
    return; // swallow — do NOT crash the app
  }
  _originalHandler(error, false);
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
