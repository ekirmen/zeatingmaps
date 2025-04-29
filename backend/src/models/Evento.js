import mongoose from 'mongoose';

const eventoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  activo: { type: Boolean, default: true },
  oculto: { type: Boolean, default: false },
  desactivado: { type: Boolean, default: false },
  sector: { type: String, required: true },
  recinto: { type: mongoose.Schema.Types.ObjectId, ref: 'Recinto', required: true },
  sala: { type: mongoose.Schema.Types.ObjectId, ref: 'Sala', required: true },
});

const Evento = mongoose.model('Evento', eventoSchema);

export default Evento;