# Daily.co Room Generator Web App & Mobile WebView Bridge (Machine A)

Proof-of-concept web application and Express backend service that creates Daily.co video meeting rooms, exposes the frontend over a Cloudflare Tunnel, and bridges meeting URLs to an Android WebView via `window.ReactNativeWebView.postMessage()`.

---

## 📁 Project Structure

```text
room-poc/
├── backend/            # Express.js + TypeScript REST API
│   ├── src/
│   │   └── index.ts    # API endpoints & Daily.co integration
│   ├── .env            # Environment configuration
│   ├── .env.example    # Sample environment file
│   ├── package.json
│   └── tsconfig.json
├── frontend/           # React 19 + Vite + TypeScript Web App
│   ├── src/
│   │   ├── App.tsx     # Single page UI & WebView bridge logic
│   │   ├── index.css   # Dark glassmorphic design system
│   │   └── vite-env.d.ts # TypeScript definitions for WebView bridge
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 🔑 Environment Variables

Create `backend/.env` with your Daily.co API key:

```env
DAILY_API_KEY=your_daily_api_key_here
PORT=3001
```

> ⚠️ **Security Note:** The `DAILY_API_KEY` is kept strictly on the Node.js backend and is **never** exposed to the frontend code.

---

## 🚀 Setup & Execution Steps

### 1. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

---

### 2. Start the Backend Server

```bash
cd backend
npm start
```
* The backend runs on `http://localhost:3001`.

---

### 3. Start the Frontend Application

```bash
cd frontend
npm run dev
```
* The Vite dev server runs on `http://localhost:5173` (accessible on `0.0.0.0:5173`).

---

### 4. Run Cloudflare Tunnel

Expose your local Vite frontend publicly to HTTPS using **cloudflared**:

```bash
cloudflared tunnel --url http://localhost:5173
```

You will see output similar to:
```text
+-----------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:                                 |
|  https://random-name.trycloudflare.com                                            |
+-----------------------------------------------------------------------------------+
```

Copy the generated HTTPS URL (e.g., `https://random-name.trycloudflare.com`) and load it in your Android WebView or desktop browser.

---

## 📡 API Specification

### Endpoint: Create Room

**POST** `/api/create-room`

#### Headers
`Content-Type: application/json`

#### Input Validation Rules
* `roomName` is required (string).
* Allowed characters: `a-z`, `A-Z`, `0-9`, `-`, `_`.
* Invalid inputs return **HTTP 400 Bad Request**.

#### Sample Request

```json
{
  "roomName": "demo-123"
}
```

#### Sample Response (HTTP 200 OK)

```json
{
  "roomUrl": "https://your-domain.daily.co/demo-123",
  "roomName": "demo-123"
}
```

#### Sample Error Response (HTTP 400 Bad Request)

```json
{
  "error": "Invalid or missing roomName. Only letters (a-z, A-Z), numbers (0-9), dashes (-), and underscores (_) are allowed."
}
```

---

## 📱 Mobile WebView Bridge Integration

When a room is successfully created or selected, the frontend automatically posts a JSON string payload to the host Android app via the `window.ReactNativeWebView.postMessage()` bridge:

```javascript
window.ReactNativeWebView.postMessage(
  JSON.stringify({
    type: 'JOIN_ROOM',
    roomUrl: 'https://your-domain.daily.co/demo-123',
    roomName: 'demo-123'
  })
);
```

### Android Native / React Native Handler Example:

```javascript
// On the Mobile App side (React Native / Android WebView Listener)
<WebView
  source={{ uri: 'https://random-name.trycloudflare.com' }}
  onMessage={(event) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'JOIN_ROOM') {
      console.log('Room URL received from WebView:', data.roomUrl);
      // Navigate to native Daily Call Screen or WebRTC View
    }
  }}
/>
```

---

## ✅ Final Verification Checklist

* [x] **Room Creation**: Entering a valid room name sends a `POST` request to `/api/create-room` and generates a Daily room URL.
* [x] **Existing Room Fallback**: Re-entering an existing room name retrieves the existing room URL without failing.
* [x] **URL Display**: Generated Daily meeting URL is rendered clearly in the UI.
* [x] **Copy / Share Actions**: Native Web Share API (`navigator.share()`) is used when available, with automatic clipboard fallback (`navigator.clipboard.writeText()`).
* [x] **WebView PostMessage Bridge**: Triggered safely using `window.ReactNativeWebView.postMessage()`.
* [x] **API Key Protection**: `DAILY_API_KEY` is only used inside Node.js backend.
