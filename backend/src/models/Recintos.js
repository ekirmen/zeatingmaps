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
