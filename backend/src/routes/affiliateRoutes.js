import express from 'express';
import mongoose from 'mongoose';
import AffiliateUser from '../models/AffiliateUser.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { login } = req.query;

    if (login) {
      const user = await User.findOne({ login });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const affiliate = await AffiliateUser.findOne({ user: user._id }).populate('user', 'login email');
      if (!affiliate) return res.status(404).json({ message: 'Affiliate not found' });

      const stats = await Payment.aggregate([
        { $match: { referrer: user._id } },
        { $group: { _id: '$referrer', purchases: { $sum: 1 }, total: { $sum: '$referralCommission' } } }
      ]);
      const stat = stats[0] || { purchases: 0, total: 0 };

      return res.json({
        _id: affiliate._id,
        user: affiliate.user,
        base: affiliate.base,
        percentage: affiliate.percentage,
        purchases: stat.purchases,
        total: stat.total
      });
    }

    const affiliates = await AffiliateUser.find().populate('user', 'login email');

    const userIds = affiliates.map(a => a.user._id);
    const stats = await Payment.aggregate([
      { $match: { referrer: { $in: userIds } } },
      { $group: {
          _id: '$referrer',
          purchases: { $sum: 1 },
          total: { $sum: '$referralCommission' }
      }}
    ]);

    const statsMap = stats.reduce((acc, s) => {
      acc[s._id.toString()] = { purchases: s.purchases, total: s.total };
      return acc;
    }, {});

    const result = affiliates.map(a => ({
      _id: a._id,
      user: a.user,
      base: a.base,
      percentage: a.percentage,
      purchases: statsMap[a.user._id.toString()]?.purchases || 0,
      total: statsMap[a.user._id.toString()]?.total || 0,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching affiliates' });
  }
});

router.post('/', async (req, res) => {
  const { userId, base = 0, percentage = 0 } = req.body;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const existing = await AffiliateUser.findOne({ user: userId });
    if (existing) return res.status(400).json({ message: 'User already added' });

    const affiliate = new AffiliateUser({
      user: userId,
      base,
      percentage
    });
    const saved = await affiliate.save();
    const populated = await saved.populate('user', 'login email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error saving affiliate' });
  }
});

router.put('/:id', async (req, res) => {
  const { userId, base, percentage } = req.body;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const update = { user: userId };
    if (base !== undefined) update.base = base;
    if (percentage !== undefined) update.percentage = percentage;

    const affiliate = await AffiliateUser.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    ).populate('user', 'login email');

    if (!affiliate) return res.status(404).json({ message: 'Affiliate not found' });

    res.json(affiliate);
  } catch (error) {
    res.status(500).json({ message: 'Error updating affiliate' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const affiliate = await AffiliateUser.findByIdAndDelete(req.params.id);
    if (!affiliate) return res.status(404).json({ message: 'Affiliate not found' });
    res.json({ message: 'Affiliate deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting affiliate' });
  }
});

export default router;
