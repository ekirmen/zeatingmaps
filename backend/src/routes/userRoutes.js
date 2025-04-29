import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Verify password route
// Update the verify password route path
router.post('/verify-password', protect, async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    res.status(200).json({ message: 'Contraseña verificada' });
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ message: 'Error al verificar la contraseña' });
  }
});

// Update the password update route path
router.put('/update-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password'); // Include password field

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Compare plain text password with hashed password in DB
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ message: 'Error al actualizar la contraseña' });
  }
});

// Obtener todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const users = await User.find(); // Obtener todos los usuarios
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});

// Actualizar un usuario por ID
router.put('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true }); // Actualizar usuario por ID

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(updatedUser); // Retornar el usuario actualizado
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    res.status(500).json({ message: "Error al actualizar el usuario" });
  }
});

import jwt from 'jsonwebtoken'; // Para generar el token JWT

// Crear un nuevo usuario
router.post('/login', async (req, res) => {
  const { login, password } = req.body;

  // Verificar si los datos necesarios están presentes
  if (!login || !password) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    // Verificar si el usuario existe
    const user = await User.findOne({ login });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar el token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token }); // Retornar el token
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ message: "Error al iniciar sesión", error: error.message });
  }
});

router.post('/user', async (req, res) => {
  const { login, password, email, telefono, perfil, empresa } = req.body;

  // Verificar si los datos necesarios están presentes
  if (!login || !password || !email || !telefono || !perfil || !empresa) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ login });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Cifrar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el nuevo usuario
    const newUser = new User({
      login,
      password: hashedPassword,
      email,
      telefono,
      perfil,
      empresa,
    });

    await newUser.save();
    res.status(201).json(newUser); // Retornar el usuario creado
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    res.status(500).json({ message: "Error al crear el usuario", error: error.message });
  }
});

// Add this route for fetching user profile
router.get('/user/profile', protect, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile route
router.put('/user/update', protect, async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from authenticated request
    const updateData = {
      login: req.body.login,
      email: req.body.email,
      telefono: req.body.telefono,
      empresa: req.body.empresa,
      perfil: req.body.perfil
    };

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error al actualizar el usuario', error: error.message });
  }
});

export default router;
