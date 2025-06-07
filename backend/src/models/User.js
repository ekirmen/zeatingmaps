// src/models/User.js

import mongoose from 'mongoose';

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
    direccion: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: true,
        select: false // This makes password field excluded by default
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

const User = mongoose.model('User', UserSchema);
export default User;
