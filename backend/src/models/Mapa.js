import mongoose from 'mongoose';

const SillaSchema = new mongoose.Schema({
  _id: String,
  nombre: String,
  posicion: {
    x: Number,
    y: Number,
  },
  zona: { type: String, default: null }, // <--- Expects 'zona'
  color: String,
  estado: String,
  mesaNombre: String,
});

const ElementoSchema = new mongoose.Schema({
  _id: String,
  type: String,
  posicion: {
    x: Number,
    y: Number,
  },
  rotation: Number,
  nombre: String,
  width: Number,
  height: Number,
  zona: { type: String, default: null }, // <--- Expects 'zona'
  sillas: [SillaSchema],
});

const MapaSchema = new mongoose.Schema({
  salaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sala', required: true, unique: true },
  contenido: [ElementoSchema],
});

const Mapa = mongoose.model('Mapa', MapaSchema);

export default Mapa;
