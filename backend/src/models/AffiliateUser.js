import mongoose from 'mongoose';

const affiliateUserSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  base: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  }
});

export default mongoose.model('AffiliateUser', affiliateUserSchema);
