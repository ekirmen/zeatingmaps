// src/controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Función para iniciar sesión
export const loginUser = async (req, res) => {
    const { login, password } = req.body;

    try {
        const user = await User.findOne({ login });

        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Función para registrar un nuevo usuario
export const registerUser = async (req, res) => {
    const { login, empresa, perfil, email, telefono, password } = req.body;

    try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el nuevo usuario
        const newUser = new User({
            login,
            empresa,
            perfil,
            email,
            telefono,
            password: hashedPassword,
            permisos: {
                administracion: { sistema: false, usuarios: false, informes: false },
                programacion: { adminFunciones: false, gestionEventos: false },
                venta: { venta: false, cancelacion: false, devolucion: false }
            },
            formaDePago: { stripe: false, efectivo: false }
        });

        await newUser.save();

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
};
