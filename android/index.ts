import 'react-native-get-random-values';
import { registerGlobals } from '@daily-co/react-native-webrtc';
import { registerRootComponent } from 'expo';

import App from './App';

// Register global WebRTC primitives (RTCPeerConnection, mediaDevices, MediaStreamTrack)
registerGlobals();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
