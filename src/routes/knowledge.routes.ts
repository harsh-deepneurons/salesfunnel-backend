import { Router } from 'express';
import multer from 'multer';
import { KnowledgeController } from '../controllers/knowledge.controller';

const router = Router();
const upload = multer();

router.post('/upload', upload.single('file'), KnowledgeController.upload);
router.get('/', KnowledgeController.list);

export default router;
