import WebSocket from 'ws';
import mongoose from 'mongoose';
import { AgentModel, type IAgent } from '../../shared/models.ts';
import { BrainService } from '../../services/llm_brain.ts';
import { type TTSProvider, PollyProvider, ElevenLabsProvider } from '../../services/tts_service.ts';
import { TranscribeService } from './transcribe.service.ts';

// --- UTILITIES: AUDIO CONVERSION (μ-law to PCM) ---
const muLawToPcm = (muLawBuffer: Buffer): Buffer => {
    const pcmBuffer = Buffer.alloc(muLawBuffer.length * 2);
    for (let i = 0; i < muLawBuffer.length; i++) {
        const ulaw = muLawBuffer[i];
        const ulawInv = ~ulaw;
        const sign = (ulawInv & 0x80) >> 7;
        const exponent = (ulawInv & 0x70) >> 4;
        const mantissa = ulawInv & 0x0F;
        let sample = (mantissa << 3) + 0x84;
        sample <<= exponent;
        sample -= 0x84;
        if (sign === 0) sample = -sample;
        pcmBuffer.writeInt16LE(sample, i * 2);
    }
    return pcmBuffer;
};

export class SocketService {
    private brainService: BrainService;
    private transcribeService: TranscribeService;

    constructor() {
        this.brainService = new BrainService();
        this.transcribeService = new TranscribeService();
    }

    async handleConnection(ws: WebSocket, agentId: string) {
        console.log(`Call Connected for Agent: ${agentId}`);

        let streamSid = '';
        let agent: IAgent | null = null;
        let ttsProvider: TTSProvider | null = null;
        let isAiSpeaking = false;

        // Audio Buffer for STT
        const audioQueue: Buffer[] = [];

        // Smart Turn-Taking State
        let transcriptAccumulator = "";
        let inputTimeout: NodeJS.Timeout | null = null;

        try {
            if (mongoose.isValidObjectId(agentId)) {
                agent = await AgentModel.findById(agentId);
            } else {
                console.error('Invalid Agent ID format');
            }
        } catch (err) {
            console.error('DB Error looking up agent', err);
        }

        if (!agent) {
            console.error('Agent not found in DB');
            ws.close();
            return;
        }

        // Initialize TTS
        if (agent.voiceProvider === 'ELEVENLABS' && agent.elevenLabsApiKey) {
            ttsProvider = new ElevenLabsProvider(agent.elevenLabsApiKey, agent.voiceId);
        } else {
            ttsProvider = new PollyProvider(agent.voiceId);
        }

        // Helper to process query
        const processQuery = async (input: string) => {
            if (!agent || !ttsProvider) return;
            if (input.trim().length < 2) return;

            try {
                const aiResponse = await this.brainService.processQuery(input, agent);
                console.log(`AI Replying: ${aiResponse}`);

                isAiSpeaking = true;
                await ttsProvider.generateStream(aiResponse, streamSid, ws);
                isAiSpeaking = false;

            } catch (err) {
                console.error('Brain Error', err);
                isAiSpeaking = true;
                await ttsProvider.generateStream("I am having trouble connecting to my brain right now.", streamSid, ws);
                isAiSpeaking = false;
            }
        };

        // Handle Transcripts
        const onTranscript = async (text: string, isPartial: boolean) => {
            // --- BARGE IN LOGIC ---
            if (isPartial) {
                // User is speaking (or noise), clear any pending turn completion
                if (inputTimeout) {
                    clearTimeout(inputTimeout);
                    inputTimeout = null;
                }

                if (isAiSpeaking) {
                    console.log('Interruption detected, stopping TTS...');
                    ttsProvider?.stop();
                    ws.send(JSON.stringify({
                        event: 'clear',
                        streamSid
                    }));
                    isAiSpeaking = false;
                }
            }

            // --- SMART TURN-TAKING LOGIC ---
            if (!isPartial) {
                // Append to accumulator
                transcriptAccumulator += ` ${text}`;

                // Clear existing timeout
                if (inputTimeout) clearTimeout(inputTimeout);

                // Set new timeout (2 seconds silence)
                inputTimeout = setTimeout(async () => {
                    const finalQuery = transcriptAccumulator.trim();
                    if (finalQuery) {
                        console.log(`User Query (Buffered): ${finalQuery}`);
                        transcriptAccumulator = ""; // Reset buffer
                        await processQuery(finalQuery);
                    }
                }, 2000);
            }
        };

        // Start STT Loop
        this.transcribeService.startTranscriptionStream(ws, audioQueue, onTranscript);

        ws.on('message', async (message: any) => {
            const data = JSON.parse(message);

            // --- POSTMAN DEBUG MODE ---
            if (data.event === 'test_input') {
                console.log(`[DEBUG] Received test input: ${data.text}`);
                await processQuery(data.text);
                return;
            }

            switch (data.event) {
                case 'start':
                    streamSid = data.start.streamSid;
                    // Greet User
                    if (agent?.initialMessage) {
                        setTimeout(() => {
                            processQuery(agent!.initialMessage);
                        }, 500);
                    }
                    break;

                case 'media':
                    // Twilio sends base64 μ-law. We decode to PCM for Transcribe.
                    const muLawChunk = Buffer.from(data.media.payload, 'base64');
                    const pcmChunk = muLawToPcm(muLawChunk);
                    audioQueue.push(pcmChunk);
                    break;

                case 'stop':
                    console.log('Call Ended');
                    ttsProvider?.stop();
                    break;
            }
        });
    }
}
