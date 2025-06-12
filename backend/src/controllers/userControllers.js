import User from '../models/User.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

// Obtener todos los usuarios (solo admin)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// Buscar usuarios por nombre, email o login (admin o supervisor)
export const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: 'Debe proporcionar un término de búsqueda' });

  try {
    const regex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [
        { nombre: regex },
        { apellido: regex },
        { email: regex },
        { login: regex },
        { empresa: regex }
      ]
    }).select('-password');

    res.json(users);
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    res.status(500).json({ message: 'Error al buscar usuarios' });
  }
};

// Obtener usuario por ID
export const getUserById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID de usuario no válido' });
  }

  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
};

// Crear nuevo usuario
export const createUser = async (req, res) => {
  const {
    login, nombre, apellido, empresa,
    perfil, email, telefono, direccion,
    password, permisos, formaDePago
  } = req.body;

  if (!login || !perfil || !email) {
    return res.status(400).json({ message: 'Campos obligatorios: login, perfil, email' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe con ese email' });
    }

    let hashedPassword;
    let passwordPending = false;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      const tempPass = uuidv4();
      hashedPassword = await bcrypt.hash(tempPass, 10);
      passwordPending = true;
    }

    const newUser = new User({
      login,
      nombre,
      apellido,
      empresa,
      perfil, 
      email,
      telefono,
      direccion,
      password: hashedPassword,
      passwordPending,
      permisos
    });

    const savedUser = await newUser.save();

    // Generar token de acceso para el nuevo usuario
    const token = jwt.sign({ id: savedUser._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      token: `Bearer ${token}`,
      user: userResponse,
      passwordPending: savedUser.passwordPending,
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

// Actualizar usuario (admin)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Si se cambia la contraseña, encriptarla
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    Object.assign(user, updates);
    await user.save();

    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

// Eliminar usuario
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    await user.deleteOne();
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};

// Obtener perfil propio
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

// Actualizar perfil propio
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const {
      nombre, apellido, empresa,
    } = req.body;

    user.nombre = nombre || user.nombre;
    user.apellido = apellido || user.apellido;
    user.empresa = empresa || user.empresa;
    user.telefono = telefono || user.telefono;
    user.direccion = direccion || user.direccion;

    await user.save();

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

// Cambiar contraseña
export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Se requieren ambas contraseñas' });
  }

  try {
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
};

// Establecer contraseña inicial
export const setPassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: 'Contraseña requerida' });
  }

  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordPending = false;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ message: 'Contraseña establecida correctamente', user: userResponse });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ message: 'Error al establecer contraseña' });
  }
};
