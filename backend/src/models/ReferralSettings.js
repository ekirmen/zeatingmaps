import mongoose from 'mongoose';

const referralSettingsSchema = new mongoose.Schema({
  mainUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

export default mongoose.model('ReferralSettings', referralSettingsSchema);
