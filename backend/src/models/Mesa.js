// src/models/Mesa.js
import mongoose from 'mongoose';

const asientoSchema = new mongoose.Schema({
  numero: { type: Number, required: true },
  ocupado: { type: Boolean, default: false }
});

const mesaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  aforo: { type: Number, required: true },
  asientos: [asientoSchema],
  sala: { type: mongoose.Schema.Types.ObjectId, ref: 'Sala', required: true }  // Referencia a la sala
});

export default mongoose.model('Mesa', mesaSchema);
