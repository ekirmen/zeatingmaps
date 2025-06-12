import mongoose from 'mongoose';
import './Mesa.js'; // Ensure Mesa model is registered

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  funcion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Funcion',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evento',  // Change from 'Event' to 'Evento' to match your model name
    required: true
  },
  payments: [{
    method: String,
    amount: Number
  }],
  seats: [{
    id: String,
    name: String,
    price: Number,
    zona: { type: mongoose.Schema.Types.ObjectId, ref: 'Zona' },
    mesa: { type: mongoose.Schema.Types.ObjectId, ref: 'Mesa' },
    acceso: { type: Number, default: 0 } // 0 = not scanned, 1 = scanned
  }],
  locator: String,
  status: String,
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  referralCommission: { type: Number, default: 0 },
  scanned: Boolean,
  history: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    scans: [{
      seatId: String,
      scannedAt: Date,
      scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
  }]
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
