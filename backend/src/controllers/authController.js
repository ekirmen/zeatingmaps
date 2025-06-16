import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Función reutilizable para generar token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
};

// Iniciar sesión
export const loginUser = async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ message: 'Login y contraseña requeridos' });
  }

  try {
    const user = await User.findOne({ login }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        login: user.login,
        nombre: user.nombre,
        apellido: user.apellido,
        empresa: user.empresa,
        perfil: user.perfil,
        email: user.email,
        telefono: user.telefono,
        direccion: user.direccion,
        permisos: user.permisos,
        formaDePago: user.formaDePago
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Registrar usuario
export const registerUser = async (req, res) => {
  const { login, empresa, perfil, email, telefono, password } = req.body;

  if (!login || !perfil || !email || !password) {
    return res.status(400).json({ message: 'Campos obligatorios: login, perfil, email, password' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      login,
      empresa,
      perfil,
      email,
      telefono,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  }
};

import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/emailService.js';

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email requerido' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const lang = (req.query.lang || req.get('accept-language') || 'es').toLowerCase();
    await sendPasswordResetEmail(user, token, lang);
    res.json({ message: 'Correo de restablecimiento enviado' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Contraseña requerida' });

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) return res.status(400).json({ message: 'Token inválido o expirado' });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};
