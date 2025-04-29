// src/routes/authGlobalRoutes.js
import express from 'express';
import { loginGlobal, registerGlobal } from '../controllers/authGlobalController.js';

const router = express.Router();

// Ruta de inicio de sesión (backoffice)
router.post('/login', loginGlobal);

// Ruta de registro de usuario (backoffice)
router.post('/register', registerGlobal);

export default router;