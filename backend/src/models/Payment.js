import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Usuario que realizó el pago
  seats: [
    {
      id: { type: String, required: true }, // ID del asiento
      name: { type: String, required: true }, // Nombre o número del asiento
      price: { type: Number, required: true }, // Precio del asiento
      zone: { type: String, required: true }, // Zona del asiento
    },
  ],
  locator: { type: String, unique: true, required: true }, // Código único de 8 caracteres
  status: { 
    type: String, 
    enum: ['bloqueado', 'reservado', 'pagado'], 
    default: 'bloqueado' 
  }, // Estado del pago
  scanned: { type: Boolean, default: false }, // Indica si el ticket ya fue escaneado
  history: [
    {
      action: { type: String, required: true }, // Acción realizada (ej. "Acceso concedido")
      timestamp: { type: Date, default: Date.now }, // Fecha y hora de la acción
    },
  ],
  createdAt: { type: Date, default: Date.now }, // Fecha de creación del pago
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
