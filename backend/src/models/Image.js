// models/Image.js
import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  // Opcional: puedes agregar más campos según tus necesidades, por ejemplo:
  // description: { type: String },
  // uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true // Esto agrega automáticamente campos createdAt y updatedAt
});

const Image = mongoose.model('Image', imageSchema);

export default Image;
