import mongoose from 'mongoose';

const metodoPagoSchema = new mongoose.Schema({
  metodo: {
    type: String,
    required: true
  },
  activo: {
    type: Boolean,
    default: false
  }
}, { collection: 'metodos_pago' });

const MetodoPago = mongoose.model('MetodoPago', metodoPagoSchema);

export default MetodoPago;
