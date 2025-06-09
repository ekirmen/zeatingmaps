import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Empresa' },
    type: { type: String, default: 'event' },
    category: { type: String },
    name: { type: String, required: true },
    public: { type: Boolean, default: true },
    relatedCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('Tag', tagSchema);
