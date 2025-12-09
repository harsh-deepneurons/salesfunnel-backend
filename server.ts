/**
 * ------------------------------------------------------------------
 * PRODUCTION VOICE AGENT SERVER
 * ------------------------------------------------------------------
 * Stack: Express, WebSocket, AWS SDK (Transcribe, Bedrock, Polly), Mongoose, ElevenLabs
 */

import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';

import { connectToDatabase } from './database';
import { SocketService } from './src/services/socket.service';

import agentRoutes from './src/routes/agent.routes';
import knowledgeRoutes from './src/routes/knowledge.routes';
import telephonyRoutes from './src/routes/telephony.routes';

dotenv.config();

// --- 1. SERVER & LOGIC ---

const { app, getWss } = expressWs(express());

app.use(cors({ origin: '*' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Connect to DB
connectToDatabase();

// --- REST API ENDPOINTS ---
app.use('/agents', agentRoutes);
app.use('/knowledge', knowledgeRoutes);
app.use('/', telephonyRoutes); // For /numbers and /incoming

// --- WEBSOCKET HANDLER ---
const socketService = new SocketService();

app.ws('/media-stream/:agentId', async (ws, req) => {
    const agentId = req.params.agentId;
    await socketService.handleConnection(ws, agentId);
});

// Run Server
const port = parseInt(process.env.PORT || '8080');
app.listen(port, '0.0.0.0', () => {
    console.log(`Voice Server running at http://0.0.0.0:${port}`);
});