import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema({
  number: String,
  isReserved: {
    type: Boolean,
    default: false
  },
  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reservedAt: {
    type: Date,
    default: null
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  temporaryHoldUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Seat = mongoose.model('Seat', seatSchema);
export default Seat;
