import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DAILY_API_KEY = process.env.DAILY_API_KEY || '';
const DAILY_DOMAIN = process.env.DAILY_DOMAIN || 'demo.daily.co';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

// Middleware
app.use(cors());
app.use(express.json());

// Validation helper: allowed characters a-z, A-Z, 0-9, -, _
const ROOM_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * POST /api/create-room
 * Request Body: { "roomName": "demo-123" }
 * Response Body: { "roomUrl": "https://...", "roomName": "demo-123" }
 */
app.post('/api/create-room', async (req: Request, res: Response): Promise<void> => {
  const { roomName } = req.body;

  // Validate roomName
  if (!roomName || typeof roomName !== 'string' || !ROOM_NAME_REGEX.test(roomName)) {
    res.status(400).json({
      error: 'Invalid or missing roomName. Only letters (a-z, A-Z), numbers (0-9), dashes (-), and underscores (_) are allowed.'
    });
    return;
  }

  // Check if Daily API key is configured
  if (!DAILY_API_KEY || DAILY_API_KEY === 'your_daily_api_key') {
    console.warn('[Warning] DAILY_API_KEY is missing or using default placeholder. Returning mock room URL.');
    res.json({
      roomUrl: `https://${DAILY_DOMAIN.replace(/^https?:\/\//, '')}/${roomName}`,
      roomName: roomName
    });
    return;
  }

  try {
    // Attempt to create room via Daily REST API
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hours from now
    const response = await axios.post(
      'https://api.daily.co/v1/rooms',
      {
        name: roomName,
        properties: {
          enable_screenshare: true,
          enable_recording: false,
          exp,
          meeting_join_hook: `${BACKEND_URL}/api/daily-webhook` // respond 200 OK to avoid crash
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DAILY_API_KEY}`
        }
      }
    );

    const roomUrl = response.data?.url || `https://api.daily.co/${roomName}`;

    res.json({
      roomUrl,
      roomName
    });
  } catch (error: any) {
    // If room already exists, Daily API returns HTTP 400/400+ with error message indicating room exists
    const errorData = error?.response?.data;
    const isAlreadyExists =
      error?.response?.status === 400 &&
      (JSON.stringify(errorData).toLowerCase().includes('already exists') ||
       errorData?.info?.toLowerCase().includes('already exists'));

    if (isAlreadyExists) {
      console.log(`Room "${roomName}" already exists. Fetching existing room details...`);
      try {
        const existingRoomRes = await axios.get(
          `https://api.daily.co/v1/rooms/${roomName}`,
          {
            headers: {
              Authorization: `Bearer ${DAILY_API_KEY}`
            }
          }
        );

        if (existingRoomRes.data && existingRoomRes.data.url) {
          res.json({
            roomUrl: existingRoomRes.data.url,
            roomName: existingRoomRes.data.name || roomName
          });
          return;
        }
      } catch (fetchErr: any) {
        console.error('Error fetching existing room from Daily API:', fetchErr?.response?.data || fetchErr.message);
      }
    }

    console.error('Daily API Error:', errorData || error.message);
    res.status(error?.response?.status || 500).json({
      error: errorData?.error || errorData?.message || 'Failed to create or retrieve room from Daily.co'
    });
  }
});

// Daily meeting_join_hook endpoint — returns 200 so Daily doesn't crash the call
app.post('/api/daily-webhook', (_req: Request, res: Response) => {
  res.json({ allow: true });
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
