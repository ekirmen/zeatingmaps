import mongoose from 'mongoose';

const ivaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  porcentaje: {
    type: Number,
    required: true,
  },
  base: {
    type: Number,
    default: 0,
  },
});

const Iva = mongoose.model('Iva', ivaSchema);

export default Iva;
