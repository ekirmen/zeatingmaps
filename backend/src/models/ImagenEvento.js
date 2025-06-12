import mongoose from 'mongoose';

const imagenEventoSchema = new mongoose.Schema(
  {
    evento: { type: mongoose.Schema.Types.ObjectId, ref: 'Evento', required: true },
    url: { type: String, required: true },
    alt: String,
  },
  { timestamps: true, collection: 'imagenes_evento' }
);

export default mongoose.model('ImagenEvento', imagenEventoSchema);
