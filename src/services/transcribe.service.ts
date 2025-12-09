import {
    TranscribeStreamingClient,
    StartStreamTranscriptionCommand,
} from '@aws-sdk/client-transcribe-streaming';
import WebSocket from 'ws';

export class TranscribeService {
    private client: TranscribeStreamingClient;

    constructor() {
        this.client = new TranscribeStreamingClient({ region: process.env.AWS_REGION });
    }

    async startTranscriptionStream(ws: WebSocket, audioQueue: Buffer[], onTranscript: (text: string, isPartial: boolean) => void) {
        try {
            const response = await this.client.send(new StartStreamTranscriptionCommand({
                LanguageCode: 'en-US',
                MediaEncoding: 'pcm',
                MediaSampleRateHertz: 8000,
                AudioStream: (async function* () {
                    while (ws.readyState === WebSocket.OPEN) {
                        if (audioQueue.length > 0) {
                            const chunk = audioQueue.shift();
                            if (chunk) yield { AudioEvent: { AudioChunk: chunk } };
                        } else {
                            await new Promise(r => setTimeout(r, 20));
                        }
                    }
                })()
            }));

            const stream = response.TranscriptResultStream;
            if (!stream) return;

            for await (const event of stream) {
                if (event.TranscriptEvent) {
                    const results = event.TranscriptEvent.Transcript?.Results;
                    if (results && results.length > 0) {
                        const result = results[0];
                        if (result.Alternatives && result.Alternatives[0].Transcript) {
                            onTranscript(result.Alternatives[0].Transcript, result.IsPartial || false);
                        }
                    }
                }
            }
        } catch (e: any) {
            if (e.name === 'AccessDeniedException' || e.$metadata?.httpStatusCode === 403) {
                console.error('\n[CRITICAL] AWS PERMISSION ERROR:');
                console.error('The AWS user does not have permission to use Amazon Transcribe Streaming.');
            }
            console.error('Transcribe Error', e);
        }
    }
}
