import mongoose from 'mongoose';

const zonaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  numerada: { type: Boolean, default: false },
  aforo: { type: Number, default: 0 },
  orden: { type: Number, default: 1 },
  color: { type: String, default: '#000000' },
  sala: { type: mongoose.Schema.Types.ObjectId, ref: 'Sala', required: true },  // Referencia a Sala
}, { timestamps: true });

export default mongoose.model('Zona', zonaSchema);
