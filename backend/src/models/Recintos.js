import mongoose from 'mongoose';

const recintoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  direccion: {
    type: String,
    required: true,
  },
  pais: String,
  estado: String,
  ciudad: String,
  codigoPostal: String,
  direccionLinea1: String,
  latitud: Number,
  longitud: Number,
  comoLlegar: String,
  capacidad: {
    type: Number,
    required: true,
  },
  salas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sala'
  }]
});

const Recinto = mongoose.model('Recintos', recintoSchema);
export default Recinto;
