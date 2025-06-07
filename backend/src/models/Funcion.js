import mongoose from 'mongoose';

const FuncionSchema = new mongoose.Schema({
  fechaCelebracion: {
    type: Date,
    required: true,
  },
  evento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evento',
    required: true,
  },
  sala: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sala',
    required: true,
  },
  plantilla: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plantilla',
    required: true,
  },
  inicioVenta: {
    type: Date,
    required: true,
  },
  finVenta: {
    type: Date,
    required: true,
  },
});

const Funcion = mongoose.model('Funcion', FuncionSchema);

export default Funcion;