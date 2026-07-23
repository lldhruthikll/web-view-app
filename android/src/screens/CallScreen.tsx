import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Daily, { DailyMediaView } from '@daily-co/react-native-daily-js';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';

type CallRouteProp = RouteProp<RootStackParamList, 'Call'>;
type CallNavProp = StackNavigationProp<RootStackParamList, 'Call'>;

interface Participant {
  session_id: string;
  local: boolean;
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
  audio: boolean;
  video: boolean;
}

export default function CallScreen() {
  const navigation = useNavigation<CallNavProp>();
  const route = useRoute<CallRouteProp>();
  const { roomUrl, roomName } = route.params;

  const callRef = useRef<any>(null);
  const [joining, setJoining] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<Record<string, Participant>>({});

  const updateParticipants = (call: any) => {
    const all = call.participants();
    const mapped: Record<string, Participant> = {};
    Object.values(all).forEach((p: any) => {
      mapped[p.session_id] = {
        session_id: p.session_id,
        local: p.local,
        videoTrack: p.tracks?.video?.persistentTrack ?? null,
        audioTrack: p.tracks?.audio?.persistentTrack ?? null,
        audio: p.audio,
        video: p.video,
      };
    });
    setParticipants(mapped);
  };

  useEffect(() => {
    const call = Daily.createCallObject();
    callRef.current = call;

    const handleJoinedMeeting = () => {
      setJoining(false);
      updateParticipants(call);
    };

    const handleParticipantUpdate = () => updateParticipants(call);
    const handleError = (evt: any) => {
      console.error('[CallScreen] Daily error:', evt);
      Alert.alert('Call Error', evt?.errorMsg || 'An error occurred.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    };

    call.on('joined-meeting', handleJoinedMeeting);
    call.on('participant-joined', handleParticipantUpdate);
    call.on('participant-updated', handleParticipantUpdate);
    call.on('participant-left', handleParticipantUpdate);
    call.on('error', handleError);

    call.join({ url: roomUrl }).catch((err: any) => {
      console.error('[CallScreen] Join failed:', err);
      Alert.alert('Failed to join room', err?.message || 'Could not connect.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    });

    return () => {
      call.leave().catch(console.error);
      call.destroy().catch(console.error);
    };
  }, []);

  const toggleMic = () => {
    if (!callRef.current) return;
    const newMuted = !micMuted;
    callRef.current.setLocalAudio(!newMuted);
    setMicMuted(newMuted);
  };

  const toggleCamera = () => {
    if (!callRef.current) return;
    const newOff = !camOff;
    callRef.current.setLocalVideo(!newOff);
    setCamOff(newOff);
    updateParticipants(callRef.current);
  };

  const toggleScreenShare = async () => {
    if (!callRef.current) return;
    try {
      if (screenSharing) {
        await callRef.current.stopScreenShare();
        setScreenSharing(false);
      } else {
        await callRef.current.startScreenShare();
        setScreenSharing(true);
      }
    } catch (err: any) {
      console.warn('[CallScreen] Screen share error:', err);
      Alert.alert('Screen share failed', err?.message || 'Could not start screen sharing.');
      setScreenSharing(false);
    }
  };

  const leaveCall = async () => {
    try {
      await callRef.current?.leave();
    } catch (err) {
      console.warn('[CallScreen] Leave error:', err);
    } finally {
      navigation.goBack();
    }
  };

  const localParticipant = Object.values(participants).find((p) => p.local);
  const remoteParticipants = Object.values(participants).filter((p) => !p.local);

  if (joining) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Joining {roomName}...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.roomName} numberOfLines={1}>{roomName}</Text>
        <Text style={styles.participantCount}>
          {Object.keys(participants).length} participant{Object.keys(participants).length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Video area */}
      <View style={styles.videoArea}>
        {/* Local video */}
        {localParticipant?.videoTrack ? (
          <View style={styles.localVideoWrapper}>
            <DailyMediaView
              videoTrack={localParticipant.videoTrack}
              audioTrack={null}
              mirror
              style={styles.localVideo}
              objectFit="cover"
              zOrder={1}
            />
            <Text style={styles.videoLabel}>You</Text>
          </View>
        ) : (
          <View style={styles.cameraOffBox}>
            <Text style={styles.cameraOffEmoji}>📷</Text>
            <Text style={styles.cameraOffText}>Camera Off</Text>
          </View>
        )}

        {/* Remote participants */}
        {remoteParticipants.length > 0 ? (
          <View style={styles.remoteSection}>
            <Text style={styles.remoteSectionLabel}>Remote Participants</Text>
            <View style={styles.remoteGrid}>
              {remoteParticipants.map((p) => (
                <View key={p.session_id} style={styles.remoteTile}>
                  {p.videoTrack ? (
                    <DailyMediaView
                      videoTrack={p.videoTrack}
                      audioTrack={p.audioTrack}
                      style={StyleSheet.absoluteFill}
                      objectFit="cover"
                      zOrder={0}
                    />
                  ) : (
                    <View style={styles.remoteVideoOff}>
                      <Text style={styles.remoteVideoOffText}>📹 Off</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingEmoji}>⏳</Text>
            <Text style={styles.waitingText}>Waiting for others to join...</Text>
            <Text style={styles.waitingSubText}>
              Open the Daily URL in a browser to join from desktop
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <ControlButton onPress={toggleMic} label={micMuted ? 'Unmute' : 'Mute'} emoji={micMuted ? '🔇' : '🎤'} active={micMuted} />
        <ControlButton onPress={toggleCamera} label={camOff ? 'Start Cam' : 'Stop Cam'} emoji={camOff ? '📵' : '📷'} active={camOff} />
        <ControlButton onPress={toggleScreenShare} label={screenSharing ? 'Stop Share' : 'Share Screen'} emoji={screenSharing ? '🛑' : '🖥️'} active={screenSharing} accent={screenSharing} />
        <ControlButton onPress={leaveCall} label="Leave" emoji="📴" danger />
      </View>
    </SafeAreaView>
  );
}

interface ControlButtonProps {
  onPress: () => void;
  label: string;
  emoji: string;
  active?: boolean;
  danger?: boolean;
  accent?: boolean;
}

function ControlButton({ onPress, label, emoji, active, danger, accent }: ControlButtonProps) {
  const bg = danger ? '#ef4444' : accent ? '#f97316' : active ? '#374151' : '#1e293b';
  return (
    <TouchableOpacity style={[styles.controlBtn, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.controlBtnEmoji}>{emoji}</Text>
      <Text style={styles.controlBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19' },
  loadingContainer: { flex: 1, backgroundColor: '#0b0f19', justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, color: '#94a3b8', fontSize: 16, fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', gap: 10 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  liveText: { color: '#ef4444', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  roomName: { flex: 1, color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  participantCount: { color: '#64748b', fontSize: 12, fontWeight: '500' },
  videoArea: { flex: 1, padding: 12, gap: 12 },
  localVideoWrapper: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1e293b', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  localVideo: { flex: 1 },
  videoLabel: { position: 'absolute', bottom: 8, left: 10, color: '#ffffff', fontSize: 12, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  cameraOffBox: { width: '100%', height: 220, borderRadius: 16, backgroundColor: '#1e293b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', gap: 8 },
  cameraOffEmoji: { fontSize: 36 },
  cameraOffText: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  remoteSection: { gap: 8 },
  remoteSectionLabel: { color: '#64748b', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  remoteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  remoteTile: { width: '48%', height: 140, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1e293b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  remoteVideoOff: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  remoteVideoOffText: { color: '#64748b', fontSize: 14 },
  waitingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  waitingEmoji: { fontSize: 36 },
  waitingText: { color: '#94a3b8', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  waitingSubText: { color: '#475569', fontSize: 13, textAlign: 'center', paddingHorizontal: 24, lineHeight: 18 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 12, paddingVertical: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', gap: 8 },
  controlBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 4, minHeight: 64 },
  controlBtnEmoji: { fontSize: 22 },
  controlBtnLabel: { color: '#f8fafc', fontSize: 10, fontWeight: '600', textAlign: 'center' },
});
