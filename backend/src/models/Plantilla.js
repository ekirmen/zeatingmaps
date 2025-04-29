import mongoose from 'mongoose';

const detalleSchema = new mongoose.Schema({
  zonaId: { type: mongoose.Schema.Types.ObjectId, required: true },
  productoId: { type: mongoose.Schema.Types.ObjectId, required: true },
  precio: { type: Number, required: true },
  comision: { type: Number },
  precioGeneral: { type: Number },
  canales: { type: String },
  orden: { type: Number },
});

const plantillaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  recinto: { type: mongoose.Schema.Types.ObjectId, ref: 'Recinto', required: true },
  sala: { type: mongoose.Schema.Types.ObjectId, ref: 'Sala', required: true },
  detalles: [detalleSchema],
});

const Plantilla = mongoose.model('Plantilla', plantillaSchema);

export default Plantilla;