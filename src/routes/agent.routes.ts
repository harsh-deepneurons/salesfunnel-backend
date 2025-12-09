import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';

const router = Router();

router.post('/', AgentController.createAgent);
router.get('/', AgentController.listAgents);

export default router;
