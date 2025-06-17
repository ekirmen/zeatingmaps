import express from 'express';
import {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers,
  updateUserPermissions,
  getUsersWithPermissions
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js'; // Add auth protection

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// GET all users
router.get('/', getUsers);

// POST create new user
router.post('/', createUser);

// Search users
router.get('/search', searchUsers);

// GET users with permissions
router.get('/with-permissions', getUsersWithPermissions);

// GET single user
router.get('/:id', getUserById);

// PUT update user
router.put('/:id', updateUser);

// Update permissions
router.put('/:id/permissions', updateUserPermissions);

// DELETE user
router.delete('/:id', deleteUser);

export default router;