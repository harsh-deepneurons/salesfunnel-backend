import {
    PollyClient,
    SynthesizeSpeechCommand,
    VoiceId
} from '@aws-sdk/client-polly';
import WebSocket from 'ws';

// Linear to μ-law lookup table
const g711Table = [
    0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3,
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
    7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7
];

const pcmToMuLaw = (pcmBuffer: Buffer): Buffer => {
    const muLawBuffer = Buffer.alloc(pcmBuffer.length / 2);
    for (let i = 0; i < muLawBuffer.length; i++) {
        let sample = pcmBuffer.readInt16LE(i * 2);
        const sign = sample < 0 ? 0x80 : 0;
        if (sample < 0) sample = -sample;
        sample = sample + 132;
        if (sample > 32767) sample = 32767;
        const exponent = g711Table[(sample >> 7) & 0xFF];
        const mantissa = (sample >> (exponent + 3)) & 0x0F;
        const mulaw = ~(sign | (exponent << 4) | mantissa);
        muLawBuffer[i] = mulaw;
    }
    return muLawBuffer;
};

export interface TTSProvider {
    name: string;
    generateStream(text: string, streamSid: string, ws: WebSocket): Promise<void>;
    stop(): void;
}

export class PollyProvider implements TTSProvider {
    name = 'POLLY';
    private client: PollyClient;
    private voiceId: string;
    private isStopped = false;

    constructor(voiceId: string = 'Matthew') {
        this.client = new PollyClient({ region: process.env.AWS_REGION });
        this.voiceId = voiceId;
    }

    stop() { this.isStopped = true; }

    async generateStream(text: string, streamSid: string, ws: WebSocket) {
        this.isStopped = false;
        try {
            const command = new SynthesizeSpeechCommand({
                Engine: 'neural',
                OutputFormat: 'pcm',
                SampleRate: '8000',
                Text: text,
                VoiceId: this.voiceId as VoiceId,
            });
            const response = await this.client.send(command);
            const stream = response.AudioStream as any;

            for await (const chunk of stream) {
                if (this.isStopped) break;
                if (ws.readyState === WebSocket.OPEN) {
                    // Convert PCM to μ-law
                    const pcmBuffer = Buffer.from(chunk);
                    const muLawBuffer = pcmToMuLaw(pcmBuffer);

                    const payload = {
                        event: 'media',
                        streamSid,
                        media: { payload: muLawBuffer.toString('base64') }
                    };
                    ws.send(JSON.stringify(payload));
                }
            }
        } catch (err) {
            console.error('Polly TTS Error:', err);
        }
    }
}

export class ElevenLabsProvider implements TTSProvider {
    name = 'ELEVENLABS';
    private apiKey: string;
    private voiceId: string;
    private elevenWs: WebSocket | null = null;

    constructor(apiKey: string, voiceId: string) {
        this.apiKey = apiKey;
        this.voiceId = voiceId;
    }

    stop() {
        if (this.elevenWs && this.elevenWs.readyState === WebSocket.OPEN) {
            this.elevenWs.close();
        }
    }

    async generateStream(text: string, streamSid: string, outputWs: WebSocket) {
        return new Promise<void>((resolve, reject) => {
            const modelId = 'eleven_turbo_v2_5';
            const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream-input?model_id=${modelId}&output_format=ulaw_8000`;

            this.elevenWs = new WebSocket(wsUrl);

            this.elevenWs.on('open', () => {
                // Init
                this.elevenWs?.send(JSON.stringify({
                    text: " ",
                    voice_settings: { stability: 0.5, similarity_boost: 0.8 }
                }));
                // Send Text
                this.elevenWs?.send(JSON.stringify({ text }));
                // Close Stream
                this.elevenWs?.send(JSON.stringify({ text: "" }));
            });

            this.elevenWs.on('message', (data: any) => {
                const resp = JSON.parse(data);
                if (resp.audio && outputWs.readyState === WebSocket.OPEN) {
                    const payload = {
                        event: 'media',
                        streamSid,
                        media: { payload: resp.audio } // ElevenLabs sends base64
                    };
                    outputWs.send(JSON.stringify(payload));
                }
                if (resp.isFinal) {
                    resolve();
                }
            });

            this.elevenWs.on('error', (err: any) => {
                console.error('ElevenLabs Error:', err);
                resolve(); // Resolve to prevent hanging
            });

            this.elevenWs.on('close', () => resolve());
        });
    }
}
