import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  seats: [{
    id: String,
    name: String,
    price: Number,
    zona: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zona'
    },
    mesa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mesa'
    }
  }],
  locator: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pendiente', 'pagado', 'cancelado'],
    default: 'pendiente'
  },
  history: [{
    action: String,
    date: Date,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;