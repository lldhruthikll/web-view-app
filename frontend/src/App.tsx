import { useState } from 'react';

interface RoomResponse {
  roomUrl: string;
  roomName: string;
  error?: string;
}

export default function App() {
  const [roomNameInput, setRoomNameInput] = useState<string>('demo-123');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<{ roomUrl: string; roomName: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [postMessageSent, setPostMessageSent] = useState<boolean>(false);

  // Validation pattern: a-z, A-Z, 0-9, -, _
  const ROOM_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setToastMsg(null);
    setPostMessageSent(false);

    const trimmed = roomNameInput.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a room name.');
      return;
    }

    if (!ROOM_NAME_REGEX.test(trimmed)) {
      setErrorMsg('Room name can only contain letters, numbers, dashes (-), and underscores (_).');
      return;
    }

    setLoading(true);

    try {
      // API call to Express backend
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/create-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roomName: trimmed })
      });

      const data: RoomResponse = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to create room.');
      }

      setRoomData({
        roomUrl: data.roomUrl,
        roomName: data.roomName
      });

      // WebView Bridge: Post Message to Android WebView
      if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
        const payload = JSON.stringify({
          type: 'JOIN_ROOM',
          roomUrl: data.roomUrl,
          roomName: data.roomName
        });
        window.ReactNativeWebView.postMessage(payload);
        setPostMessageSent(true);
        console.log('Successfully posted message to window.ReactNativeWebView:', payload);
      } else {
        console.warn('window.ReactNativeWebView bridge is not available in standard web browser.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while contacting the server.');
    } finally {
      setLoading(false);
    }
  };

  // Share action with navigator.share() and clipboard fallback
  const handleShareLink = async () => {
    if (!roomData?.roomUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join Meeting: ${roomData.roomName}`,
          text: `Click to join the meeting room ${roomData.roomName}:`,
          url: roomData.roomUrl
        });
        showToast('Shared successfully!');
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }

    // Fallback to Clipboard
    try {
      await navigator.clipboard.writeText(roomData.roomUrl);
      showToast('URL copied to clipboard!');
    } catch (clipErr) {
      showToast('Failed to copy URL.');
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    if (!roomData?.roomUrl) return;
    try {
      await navigator.clipboard.writeText(roomData.roomUrl);
      showToast('Copied to clipboard!');
    } catch (err) {
      showToast('Failed to copy URL.');
    }
  };

  // Join on Phone / Mobile WebView Trigger
  const handleJoinOnPhone = () => {
    if (!roomData?.roomUrl) return;

    if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
      const payload = JSON.stringify({
        type: 'JOIN_ROOM',
        roomUrl: roomData.roomUrl,
        roomName: roomData.roomName
      });
      window.ReactNativeWebView.postMessage(payload);
      showToast('Sent join message to Mobile WebView!');
    } else {
      window.open(roomData.roomUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <div className="brand-badge">
            <span className="dot"></span>
            Daily.co Integration
          </div>
          <h1>Meeting Room Generator</h1>
          <p className="subtitle">Enter a room name to generate a Daily video room and bridge to your mobile app.</p>
        </div>

        <form onSubmit={handleCreateRoom}>
          <div className="form-group">
            <label htmlFor="roomNameInput">Room Name</label>
            <div className="input-wrapper">
              <span className="input-prefix">#</span>
              <input
                id="roomNameInput"
                type="text"
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                placeholder="e.g. demo-123"
                disabled={loading}
              />
            </div>
            {errorMsg && <div className="error-text">⚠️ {errorMsg}</div>}
          </div>

          <button
            id="createMeetingBtn"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating Room...
              </>
            ) : (
              'Create Meeting'
            )}
          </button>
        </form>

        {roomData && (
          <div className="result-box">
            <div className="result-header">
              <span className="result-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Room Ready
              </span>
            </div>

            <div className="url-display" id="generatedRoomUrl">
              {roomData.roomUrl}
            </div>

            <div className="action-grid">
              <button
                id="joinPhoneBtn"
                className="btn btn-secondary full-width"
                onClick={handleJoinOnPhone}
              >
                📱 Join on Phone
              </button>

              <button
                id="shareLinkBtn"
                className="btn btn-outline"
                onClick={handleShareLink}
              >
                🔗 Share Link
              </button>

              <button
                id="copyUrlBtn"
                className="btn btn-outline"
                onClick={handleCopyUrl}
              >
                📋 Copy URL
              </button>
            </div>

            {postMessageSent && (
              <div className="webview-badge">
                ⚡ Sent payload to Android WebView via postMessage()
              </div>
            )}

            {toastMsg && <div className="toast">{toastMsg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
