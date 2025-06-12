import express from 'express';
import mongoose from 'mongoose';
import AffiliateUser from '../models/AffiliateUser.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const affiliates = await AffiliateUser.find().populate('user', 'login email');
    res.json(affiliates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching affiliates' });
  }
});

router.post('/', async (req, res) => {
  const { userId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const existing = await AffiliateUser.findOne({ user: userId });
    if (existing) return res.status(400).json({ message: 'User already added' });

    const affiliate = new AffiliateUser({ user: userId });
    const saved = await affiliate.save();
    const populated = await saved.populate('user', 'login email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error saving affiliate' });
  }
});

export default router;
