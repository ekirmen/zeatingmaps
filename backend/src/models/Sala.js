// src/models/Sala.js
import mongoose from 'mongoose';

const salaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  recinto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recintos', // Esto enlaza la sala con el recinto correspondiente
    required: true,
  },
});

const Sala = mongoose.model('Sala', salaSchema);
export default Sala;
