import { Router } from 'express';
import { getPageData, savePageData } from '../controllers/cmsController.js';
import { protect as authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/:pageId', getPageData);
router.post('/:pageId', authMiddleware, savePageData);

export default router;
