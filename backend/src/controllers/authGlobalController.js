// src/controllers/authGlobalController.js
import UsuarioGlobal from '../models/UsuarioGlobal.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Iniciar sesión (Login)
export const loginGlobal = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await UsuarioGlobal.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, userId: user._id, email: user.email });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// Registrar nuevo usuario global
export const registerGlobal = async (req, res) => {
    const { email, password, phone } = req.body;

    try {
        const existingUser = await UsuarioGlobal.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new UsuarioGlobal({
            email,
            password: hashedPassword,
            phone,
        });

        await newUser.save();

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
};
