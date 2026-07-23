import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  PermissionsAndroid,
  Platform,
  Alert,
  ActivityIndicator,
  Text,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';

// ─────────────────────────────────────────────────────────────
// UPDATE THIS URL every time you restart the Cloudflare Tunnel
// ─────────────────────────────────────────────────────────────
const WEB_APP_URL = 'https://web-view-app-ruby.vercel.app/';

type NavProp = StackNavigationProp<RootStackParamList, 'WebView'>;

interface WebViewMessage {
  type: string;
  roomUrl?: string;
  roomName?: string;
  token?: string;
}

async function requestPermissions(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);

    const cameraOk = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted';
    const micOk = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted';

    if (!cameraOk || !micOk) {
      Alert.alert(
        'Permissions Required',
        'Camera and microphone permissions are needed to join meetings.',
        [{ text: 'OK' }]
      );
    }
  } catch (err) {
    console.warn('Permission request error:', err);
  }
}

export default function WebViewScreen() {
  const navigation = useNavigation<NavProp>();
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);
      console.log('[WebViewScreen] Received message:', message);

      if (message.type === 'JOIN_ROOM' && message.roomUrl && message.roomName) {
        navigation.navigate('Call', {
          roomUrl: message.roomUrl,
          roomName: message.roomName,
          token: message.token || '',
        });
      }
    } catch (err) {
      console.warn('[WebViewScreen] Failed to parse message:', event.nativeEvent.data);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webview}
        onMessage={handleMessage}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading meeting room...</Text>
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('[WebViewScreen] WebView error:', nativeEvent);
          Alert.alert(
            'Failed to load page',
            `Could not load ${WEB_APP_URL}\n\nMake sure the Cloudflare tunnel is running and the URL is up to date.`,
            [{ text: 'OK' }]
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b0f19',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
