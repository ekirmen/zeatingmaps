import mongoose from 'mongoose';

const descuentoSchema = new mongoose.Schema({
  nombreCodigo: { type: String, required: true },
  fechaInicio: { type: Date, required: true },
  fechaFinal: { type: Date, required: true },
  evento: { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', required: true },
  detalles: [{
    zona: { type: mongoose.Schema.Types.ObjectId, ref: 'Zona', required: true },
    tipo: { type: String, enum: ['monto', 'porcentaje'], default: 'monto' },
    valor: { type: Number, required: true }
  }]
}, { timestamps: true });

export default mongoose.model('Descuento', descuentoSchema);
