import express from 'express';
import { loginGlobal, registerGlobal } from '../controllers/authGlobalController.js';

const router = express.Router();

// Ruta de inicio de sesión (clientes)
router.post('/login', loginGlobal);

// Ruta de registro de usuario global (clientes)
router.post('/register', registerGlobal);

export default router;
