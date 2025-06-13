import mongoose from 'mongoose';

const abonoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageType: { type: String, required: true }, // completo, parcial, etc.
  seat: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true },
  startDate: Date,
  endDate: Date,
  status: { type: String, default: 'activo' },
  benefits: [String],
  payments: [{
    method: String,
    amount: Number,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('Abono', abonoSchema);
