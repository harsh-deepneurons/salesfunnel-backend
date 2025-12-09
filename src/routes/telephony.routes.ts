import { Router } from 'express';
import { TelephonyController } from '../controllers/telephony.controller';

const router = Router();

router.get('/numbers', TelephonyController.listNumbers);
router.post('/incoming', TelephonyController.handleIncomingCall);

export default router;
