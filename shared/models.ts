import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeBase extends Document {
    userId: string;
    filename: string;
    s3Key: string;
    contentType: string;
    size: number;
    createdAt: Date;
}

export interface IAgent extends Document {
    userId: string;
    name: string;
    businessName: string;
    language: string;
    voiceProvider: 'POLLY' | 'ELEVENLABS';
    voiceId: string;
    voiceGender?: string;
    elevenLabsApiKey?: string;
    knowledgeBaseId?: string; // ID of the KnowledgeBase document
    phoneNumber?: string;
    customPrompt?: string;
    initialMessage: string;
    timezone: string;
    llmModel: string;

    // Config Flags
    collectDetails: {
        name: boolean;
        email: boolean;
        address: boolean;
        contactIssue: boolean;
    };
    isActive: boolean;
    createdAt: Date;
}

const KnowledgeBaseSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    s3Key: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const AgentSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    businessName: { type: String, default: '' },
    language: { type: String, default: 'English' },
    voiceProvider: { type: String, enum: ['POLLY', 'ELEVENLABS'], default: 'POLLY' },
    voiceId: { type: String, required: true },
    elevenLabsApiKey: { type: String },
    knowledgeBaseId: { type: Schema.Types.ObjectId, ref: 'KnowledgeBase' },
    phoneNumber: { type: String },
    customPrompt: { type: String, default: "You are a helpful receptionist." },
    initialMessage: { type: String, default: "Hello, how can I help you?" },
    timezone: { type: String, default: 'UTC' },
    llmModel: { type: String, default: 'anthropic.claude-3-sonnet-20240229-v1:0' },
    collectDetails: {
        name: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        address: { type: Boolean, default: false },
        contactIssue: { type: Boolean, default: true }
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export const KnowledgeBaseModel = mongoose.model<IKnowledgeBase>('KnowledgeBase', KnowledgeBaseSchema);
export const AgentModel = mongoose.model<IAgent>('Agent', AgentSchema);
