import mongoose from 'mongoose';

const empresaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  baseDatos: { type: String, required: true },
  configuracionGlobal: {
    ivaPorDefecto: { type: Number, default: 12 },
    moneda: { type: String, default: 'USD' },
  },
  estado: { type: String, default: 'activa' },
  createdAt: { type: Date, default: Date.now },
});

const Empresa = mongoose.model('Empresa', empresaSchema);

export default Empresa;
