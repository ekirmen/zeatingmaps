// src/models/User.js

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const UserSchema = new mongoose.Schema({
    login: {
        type: String,
        required: true,
        unique: true
    },
    nombre: {
        type: String,
        required: false
    },
    apellido: {
        type: String,
        required: false
    },
    empresa: {
        type: String,
        required: false
    },
    perfil: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    telefono: {
        type: String,
        required: false
    },
    referralCode: {
        type: String,
        unique: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    direccion: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: true,
        select: false // This makes password field excluded by default
    },
    passwordPending: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    permisos: {
        administracion: {
            sistema: { type: Boolean, default: false },
            usuarios: { type: Boolean, default: false },
            informes: { type: Boolean, default: false }
        },
        programacion: {
            adminFunciones: { type: Boolean, default: false },
            gestionEventos: { type: Boolean, default: false },
            modificarComisionesUsuario: { type: Boolean, default: false },
            gestionCupos: { type: Boolean, default: false },
            gestionFidelizaciones: { type: Boolean, default: false },
            gestionEncuestas: { type: Boolean, default: false },
            gestionColasVirtuales: { type: Boolean, default: false }
        },
        venta: {
            venta: { type: Boolean, default: false },
            cancelacion: { type: Boolean, default: false },
            devolucion: { type: Boolean, default: false },
            reimpresion: { type: Boolean, default: false },
            buscarVentas: { type: Boolean, default: false },
            reservas: { type: Boolean, default: false },
            ventaAcumulada: { type: Boolean, default: false },
            bloqueos: { type: Boolean, default: false }
        }
    }
});

// Generate a referral code automatically if not present
UserSchema.pre('save', function (next) {
    if (!this.referralCode) {
        this.referralCode = uuidv4();
    }
    next();
});

const User = mongoose.model('User', UserSchema);
export default User;
