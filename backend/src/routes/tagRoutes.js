import express from 'express';
import Tag from '../models/Tag.js';

const router = express.Router();

// Get all tags
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create tag
router.post('/', async (req, res) => {
  try {
    const tag = new Tag(req.body);
    const saved = await tag.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
