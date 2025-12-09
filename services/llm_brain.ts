import {
    BedrockAgentRuntimeClient,
    RetrieveAndGenerateCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import {
    BedrockRuntimeClient,
    InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime';

export class BrainService {
    private bedrockAgentRuntime: BedrockAgentRuntimeClient;
    private bedrockRuntime: BedrockRuntimeClient;

    constructor() {
        this.bedrockAgentRuntime = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION });
        this.bedrockRuntime = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
    }

    async processQuery(input: string, agent: any): Promise<string> {
        // Priority: Knowledge Base -> Bedrock (Default)

        if (agent.knowledgeBaseId) {
            return this.queryKnowledgeBase(input, agent.knowledgeBaseId);
        }

        // Default to Bedrock
        return this.queryLLMDirectly(input, agent.customPrompt || "You are a helpful assistant.");
    }

    private async queryKnowledgeBase(input: string, kbId: string): Promise<string> {
        try {
            const command = new RetrieveAndGenerateCommand({
                input: { text: input },
                retrieveAndGenerateConfiguration: {
                    type: 'KNOWLEDGE_BASE',
                    knowledgeBaseConfiguration: {
                        knowledgeBaseId: kbId,
                        modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
                    }
                }
            });

            const response = await this.bedrockAgentRuntime.send(command);
            return response.output?.text || "I'm sorry, I didn't find an answer in the knowledge base.";
        } catch (err) {
            console.error('Bedrock KB Error:', err);
            return "I'm having trouble accessing my knowledge base right now.";
        }
    }

    private async queryLLMDirectly(input: string, systemPrompt: string): Promise<string> {
        try {
            // Enforce conciseness
            const concisePrompt = `${systemPrompt}\n\nIMPORTANT: Keep your response concise, under 2 sentences if possible. Do not ramble. Be direct and to the point.`;

            // Using Claude 3 Sonnet via InvokeModel
            const payload = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 1000,
                system: concisePrompt,
                messages: [
                    { role: "user", content: input }
                ]
            };

            const command = new InvokeModelCommand({
                modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify(payload)
            });

            const response = await this.bedrockRuntime.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));

            return responseBody.content[0].text;
        } catch (err) {
            console.error('Bedrock LLM Error:', err);
            return "I'm having trouble thinking right now.";
        }
    }
}
