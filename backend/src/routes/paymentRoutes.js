import express from 'express';
import Payment from '../models/Payment.js';

const router = express.Router();

// Fetch all payments
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new payment
router.post('/', async (req, res) => {
  try {
    const { user, seats, status } = req.body;

    // Check for required fields
    if (!user) {
      return res.status(400).json({ message: 'User is required' });
    }

    // Generate a unique locator if not provided
    const locator = req.body.locator || Math.random().toString(36).substring(2, 10);

    const payment = new Payment({
      user,
      seats,
      locator,
      status
    });

    const savedPayment = await payment.save();
    res.status(201).json(savedPayment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Error processing payment', error: error.message });
  }
});

export default router;
