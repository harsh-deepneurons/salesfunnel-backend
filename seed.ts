import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { AgentModel } from './shared/models.ts';
import { connectToDatabase } from './database.ts';

dotenv.config();

const seed = async () => {
    await connectToDatabase();

    // Clear existing agents for this user
    await AgentModel.deleteMany({ userId: '656e616d65645f6167656e74' });

    // 1. Bedrock Agent (Support - Claude Sonnet)
    const supportAgent = new AgentModel({
        userId: '656e616d65645f6167656e74',
        name: 'Customer Support (Claude)',
        businessName: 'Anthropic Support',
        language: 'English',
        voiceProvider: 'POLLY',
        voiceId: 'Joanna',
        initialMessage: "Hello! I am your support assistant powered by Claude Sonnet. How can I help you today?",
        customPrompt: "You are a helpful, empathetic customer support agent. You are powered by Anthropic Claude 3.5 Sonnet. Keep your answers concise and helpful.",
        llmModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
        isActive: true,
        collectDetails: {
            name: true,
            email: true,
            address: false,
            contactIssue: true
        }
    });

    // 2. Bedrock Agent (Sales - Claude Haiku)
    const salesAgent = new AgentModel({
        userId: '656e616d65645f6167656e74',
        name: 'Sales Representative (Haiku)',
        businessName: 'Anthropic Sales',
        language: 'English',
        voiceProvider: 'POLLY',
        voiceId: 'Matthew',
        initialMessage: "Hi there! I'm here to help you find the best products. What are you looking for?",
        customPrompt: "You are an energetic and persuasive sales representative. You are powered by Anthropic Claude 3 Haiku. Focus on benefits and closing the deal. Keep it short.",
        llmModel: 'anthropic.claude-3-haiku-20240307-v1:0',
        isActive: true,
        collectDetails: {
            name: true,
            email: true,
            address: true,
            contactIssue: false
        }
    });

    // 3. Bedrock Agent (Technical - Llama 3)
    const techAgent = new AgentModel({
        userId: '656e616d65645f6167656e74',
        name: 'Tech Support (Llama 3)',
        businessName: 'Meta Tech',
        language: 'English',
        voiceProvider: 'POLLY',
        voiceId: 'Stephen',
        initialMessage: "Greetings. I am the technical support unit. State your technical issue.",
        customPrompt: "You are a precise and logical technical support engineer. You are powered by Meta Llama 3 via Bedrock. Provide step-by-step solutions.",
        llmModel: 'meta.llama3-70b-instruct-v1:0', // Example model ID, verify availability
        isActive: true,
        collectDetails: {
            name: true,
            email: false,
            address: false,
            contactIssue: true
        }
    });

    await supportAgent.save();
    await salesAgent.save();
    await techAgent.save();

    console.log('Seeding Complete!');
    console.log('Support Agent ID:', supportAgent._id);
    console.log('Sales Agent ID:', salesAgent._id);
    console.log('Tech Agent ID:', techAgent._id);

    process.exit(0);
};

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
