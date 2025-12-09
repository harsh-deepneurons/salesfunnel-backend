# Voice Agent SaaS Platform

This project consists of a Next.js frontend and a Node.js (Fastify) Voice Server.

## Prerequisites

- Node.js v18+
- MongoDB
- AWS Credentials (with access to Transcribe, Bedrock, Polly, S3)
- Twilio Account
- ElevenLabs API Key (optional)
- ngrok (for local development)

## Setup

### 1. Voice Server

Navigate to `voice-server`:
```bash
cd voice-server
npm install
```

Create a `.env` file in `voice-server`:
```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/voice-agent
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
BEDROCK_KB_ID=...
```

Run the server:
```bash
npm run dev
# or
npx tsx server.ts
```

### 2. Frontend

Navigate to `frontend`:
```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend`:
```env
NEXT_PUBLIC_VOICE_SERVER_URL=http://localhost:8080
```

Run the frontend:
```bash
npm run dev
```

## Local Development with Twilio (ngrok)

To test voice calls locally, you need to expose your local Voice Server to the internet.

1.  Start ngrok:
    ```bash
    ngrok http 8080
    ```
2.  Copy the HTTPS URL (e.g., `https://abc.ngrok-free.app`).
3.  Configure your Twilio Phone Number's Voice Webhook to:
    `https://abc.ngrok-free.app/incoming`
4.  Ensure your frontend `.env.local` points to the ngrok URL if you are testing from a different device, or keep it localhost if running on the same machine (but Twilio needs the public URL).

## Features

- **Agent Creation**: Create custom agents with specific prompts, voices, and knowledge bases.
- **Real-time Voice**: Low-latency voice interaction using WebSocket, AWS Transcribe, and ElevenLabs/Polly.
- **RAG**: Upload documents to train your agent using AWS Bedrock Knowledge Bases.
