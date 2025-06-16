import express from 'express';
import { getReservationTime, updateReservationTime } from '../controllers/settingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/reservation-time', getReservationTime);
router.post('/reservation-time', protect, updateReservationTime);

export default router;
