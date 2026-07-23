# Daily.co Android PoC — React Native / Expo

Android-only proof-of-concept that:
1. Loads a Cloudflare Tunnel URL inside a WebView
2. Receives `JOIN_ROOM` postMessage from the web app
3. Joins the meeting natively using the **Daily Android SDK**
4. Supports mic toggle, camera toggle, Android screen sharing (MediaProjection), and leaving

---

## 📁 Project Structure

```text
android/
├── app.json                    # Expo config, permissions
├── App.tsx                     # Navigation root
├── src/
│   └── screens/
│       ├── WebViewScreen.tsx   # Loads Cloudflare URL, handles postMessage
│       └── CallScreen.tsx      # Daily SDK call — video, mic, cam, screen share
└── README.md
```

---

## 🔑 How to Update the Cloudflare Tunnel URL

Each time you restart `cloudflared`, the public URL changes.

Open `src/screens/WebViewScreen.tsx` and update line 20:

```typescript
const WEB_APP_URL = 'https://YOUR-NEW-URL.trycloudflare.com';
```

Then rebuild with `npx expo run:android`.

---

## 🚀 Setup & Run

### Prerequisites

- Node.js 18+
- Android Studio + Android SDK (API 24+)
- ADB-connected Android device or emulator
- Java 17

### 1. Install dependencies

```bash
npm install
```

### 2. Prebuild native Android project

```bash
npx expo prebuild
```

### 3. Run on Android device

```bash
npx expo run:android
```

---

## 📡 WebView → Native Communication

The web app at the Cloudflare URL sends this message when a room is created:

```json
{
  "type": "JOIN_ROOM",
  "roomUrl": "https://pmax.daily.co/demo-123",
  "roomName": "demo-123"
}
```

`WebViewScreen.tsx` parses this via `onMessage` and navigates to the native `CallScreen`.

---

## 📱 Using the App

1. Open app → WebView loads the Cloudflare URL
2. Enter a room name in the web UI → tap **Create Meeting**
3. App automatically navigates to the native call screen
4. Grant camera & microphone permissions when prompted
5. Tap **Share Screen** → approve Android screen-capture dialog
6. Open the Daily room URL on a desktop browser to verify the connection

---

## ⚠️ Known Limitations

- **Quick Cloudflare Tunnels** regenerate a new URL on every restart — requires rebuilding the app or adding a URL input field
- Screen sharing requires a physical Android device (some emulators don't support MediaProjection)
- `@daily-co/react-native-daily-js` is not compatible with Expo Go — must use `npx expo run:android`
- Minimum Android API level: **24** (Android 7.0)
