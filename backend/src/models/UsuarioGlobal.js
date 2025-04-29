// src/models/UsuarioGlobal.js
import mongoose from 'mongoose';

const UsuarioGlobalSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
});

const UsuarioGlobal = mongoose.model('UsuarioGlobal', UsuarioGlobalSchema);
export default UsuarioGlobal;