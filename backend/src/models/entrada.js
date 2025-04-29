import mongoose from 'mongoose';

const entradaSchema = mongoose.Schema({
  producto: String,
  min: Number,
  max: Number,
  iva: String,
  activo: { type: Boolean, default: true },
  tipoProducto: String,
  recinto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recinto'
  }
}, {
  timestamps: true
});

const Entrada = mongoose.model('Entrada', entradaSchema);

export default Entrada;
