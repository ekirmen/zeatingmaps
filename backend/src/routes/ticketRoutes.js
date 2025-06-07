import express from 'express';
import { downloadTicket, getUserTickets } from '../controllers/ticketController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get ticket by locator
router.get('/locator/:locator', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ locator: req.params.locator })
      .populate({
        path: 'user',
        select: '-password'
      })
      .populate('event');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download ticket PDF
router.get('/download/:locator', protect, downloadTicket);

// Get user's tickets history
router.get('/user/:userId', protect, getUserTickets);

export default router;