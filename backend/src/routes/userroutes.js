import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';

import {
  getUsers,
  getUserById,
  createUser, // This is the correct import
  updateUser,
  deleteUser,
  searchUsers,
  changePassword,
  setPassword,
  getProfile,
  updateProfile
} from '../controllers/userControllers.js';

import {
  protect,
  authorizeRoles
} from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', createUser);

// Middleware para proteger todas las rutas debajo de este punto
router.use(protect);

// Rutas con autorización específica

// Obtener todos los usuarios (solo admin)
router.get('/', authorizeRoles('admin'), getUsers);

// Buscar usuarios (admin y supervisor)
router.get('/search', authorizeRoles('admin', 'supervisor'), searchUsers);

// Crear un usuario (admin y supervisor)
router.post('/', authorizeRoles('admin', 'supervisor'), createUser);

// Obtener usuario por ID (admin y supervisor)
router.get('/:id', authorizeRoles('admin', 'supervisor'), async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {   
     const user = await getUserById(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
});

// Actualizar usuario (solo admin)
router.put('/:id', authorizeRoles('admin'), updateUser);

// Eliminar usuario (solo admin)
router.delete('/:id', authorizeRoles('admin'), deleteUser);

// Cambiar contraseña (usuario autenticado)
router.put('/profile/change-password', changePassword);
router.post('/set-password', setPassword);

// Obtener perfil propio (usuario autenticado)
router.get('/profile/me', getProfile);

// Actualizar perfil propio (usuario autenticado)
router.put('/profile/me', updateProfile);

// Ruta administrativa exclusiva ejemplo
router.delete('/admin-only-route/:id', authorizeRoles('admin'), deleteUser);

export default router;
