import type { Request, Response } from 'express';
import { AgentModel } from '../../shared/models';

export class AgentController {
    static async createAgent(req: Request, res: Response) {
        try {
            const agentData = req.body;
            // Basic validation
            if (!agentData.agentName || !agentData.voice) {
                res.status(400).send({ error: 'Missing required fields' });
                return;
            }

            const newAgent = new AgentModel({
                userId: '656e616d65645f6167656e74', // Hardcoded for now
                name: agentData.agentName,
                businessName: agentData.businessName,
                language: agentData.language,
                voiceProvider: agentData.voiceProvider || 'POLLY',
                voiceId: agentData.voice,
                voiceGender: agentData.voiceGender,
                initialMessage: agentData.initialMessage,
                timezone: agentData.timezone,
                llmModel: agentData.llmModel,
                collectDetails: agentData.collectDetails,
            });

            await newAgent.save();
            res.status(201).send(newAgent);
        } catch (err) {
            console.error('Create Agent Error:', err);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    }

    static async listAgents(req: Request, res: Response) {
        try {
            const agents = await AgentModel.find({ userId: '656e616d65645f6167656e74' }).sort({ createdAt: -1 });
            res.send(agents);
        } catch (err) {
            res.status(500).send({ error: 'Internal Server Error' });
        }
    }
}
