import mongoose from 'mongoose';

const descuentoSchema = new mongoose.Schema({
  nombreCodigo: { type: String, required: true },
  cantidad: { type: Number, required: true },
  fechaInicio: { type: Date, required: true },
  fechaFinal: { type: Date, required: true },
  evento: { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', required: true },
  zonas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Zona' }]
}, { timestamps: true });

export default mongoose.model('Descuento', descuentoSchema);
