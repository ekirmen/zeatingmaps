import mongoose from 'mongoose';

// Esquema para las sillas
const SillaSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // ID único para la silla
  nombre: { type: String, required: true }, // Nombre de la silla
  posicion: {
    x: { type: Number, required: true }, // Posición X
    y: { type: Number, required: true }, // Posición Y
  },
  zona: { type: mongoose.Schema.Types.ObjectId, ref: 'Zona', default: null }, // Zona asignada
  color: { type: String, default: 'gray' }, // Color de la silla
});

// Esquema para los elementos del mapa (mesas o sillas)
const ElementoSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // ID único para el elemento
  type: { type: String, required: true, enum: ['rect', 'circle', 'silla'] }, // Tipo de elemento
  posicion: {
    x: { type: Number, required: true }, // Posición X
    y: { type: Number, required: true }, // Posición Y
  },
  nombre: { type: String, required: true }, // Nombre del elemento
  rotation: { type: Number, default: 0 }, // Rotación del elemento
  width: { type: Number, default: 80 }, // Ancho del elemento (solo para mesas)
  height: { type: Number, default: 80 }, // Alto del elemento (solo para mesas)
  zona: { type: mongoose.Schema.Types.ObjectId, ref: 'Zona', default: null }, // Zona asignada
  sillas: [SillaSchema], // Lista de sillas asociadas (solo para mesas)
});

// Esquema para el mapa
const MapaSchema = new mongoose.Schema({
  sala: { type: mongoose.Schema.Types.ObjectId, ref: 'Sala', required: true, unique: true }, // ID de la sala

  contenido: [ElementoSchema], // Lista de elementos (mesas o sillas)
});

// Crear el modelo Mapa
const Mapa = mongoose.model('Mapa', MapaSchema);

export default Mapa;
