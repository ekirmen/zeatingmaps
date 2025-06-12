import mongoose from 'mongoose';

const affiliateUserSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true }
});

export default mongoose.model('AffiliateUser', affiliateUserSchema);
