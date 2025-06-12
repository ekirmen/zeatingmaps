import express from 'express';
import { getTemplates, getTemplate, updateTemplate } from '../controllers/emailTemplateController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getTemplates);
router.get('/:type', protect, getTemplate);
router.put('/:type', protect, updateTemplate);

export default router;
