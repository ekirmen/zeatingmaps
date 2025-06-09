import mongoose from 'mongoose';

const eventoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  fecha: { type: Date, required: true }, // Add fecha field
  sector: { type: String },
  descripcionHTML: { type: String },
  resumenDescripcion: { type: String },
  videoURL: { type: String },
  recinto: { type: mongoose.Schema.Types.ObjectId, ref: 'Recinto', required: true },
  sala: { type: mongoose.Schema.Types.ObjectId, ref: 'Sala', required: true },
  imagenes: {
    banner: String,
    obraImagen: String,
    portada: String,
    espectaculo: [String],
    logoHorizontal: String,
    logoVertical: String,
    bannerPublicidad: String,
    logoCuadrado: String,
    logoPassbook: String,
    passBookBanner: String,
    icono: String
  },
  configuracionBoletas: {
    formatosPDF: {
      habilitado: { type: Boolean, default: false },
      tipo: { type: String, enum: ['all', 'single'], default: 'single' }
    },
    formatoPassbook: { type: Boolean, default: false },
    impresionTaquilla: { type: Boolean, default: false },
    terminosLegales: { type: String }
  },
  otrasOpciones: {
    observacionesEmail: {
      mostrar: { type: Boolean, default: false },
      texto: { type: String }
    },
    observacionesCompra: {
      mostrar: { type: Boolean, default: false },
      texto: { type: String }
    },
    popupAntesAsiento: {
      mostrar: { type: Boolean, default: false },
      texto: { type: String }
    },
    metodosPagoPermitidos: {
      type: [String],
      default: []
    }
  },
  activo: { type: Boolean, default: true },
  oculto: { type: Boolean, default: false },
  desactivado: { type: Boolean, default: false },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actualizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Evento', eventoSchema);
