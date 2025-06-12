import express from 'express';
import mongoose from 'mongoose';
import ReferralSettings from '../models/ReferralSettings.js';
import User from '../models/User.js';

const router = express.Router();

// Get main referral user
router.get('/main-user', async (req, res) => {
  try {
    let settings = await ReferralSettings.findOne().populate('mainUser', 'login email');
    if (!settings) {
      settings = await ReferralSettings.create({});
    }
    res.json(settings.mainUser);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching main user' });
  }
});

// Update main referral user
router.put('/main-user/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let settings = await ReferralSettings.findOne();
    if (!settings) {
      settings = new ReferralSettings({ mainUser: userId });
    } else {
      settings.mainUser = userId;
    }
    const saved = await settings.save();
    const populated = await saved.populate('mainUser', 'login email');
    res.json(populated.mainUser);
  } catch (error) {
    res.status(500).json({ message: 'Error setting main user' });
  }
});

export default router;
