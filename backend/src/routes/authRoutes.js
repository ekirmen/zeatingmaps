import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// LOGIN - General
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    const user = await User.findOne({ login }).select('+password +passwordPending');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.passwordPending) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      token: `Bearer ${token}`,
      user: userResponse,
      passwordPending: user.passwordPending,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// LOGIN - Store
router.post('/store/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    const user = await User.findOne({ login }).select('+password +passwordPending');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.passwordPending) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      token,
      user: userResponse,
      passwordPending: user.passwordPending,
    });
  } catch (error) {
    console.error('Store login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET USER PROFILE
router.get('/user/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// UPDATE PROFILE (by ID param)
router.put('/user/:id', protect, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// UPDATE PROFILE (own profile)
router.put('/user/update', protect, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.json(updatedUser);
  } catch (error) {
    console.error('Own profile update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// UPDATE PASSWORD
router.put('/user/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Contraseña actual incorrecta' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ message: 'Error al actualizar la contraseña' });
  }
});

export default router;
