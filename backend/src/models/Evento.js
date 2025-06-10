import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const eventoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  slug: { type: String, unique: true },
  // Fecha del evento. Si no se especifica se asigna la fecha de creación
  fecha: { type: Date, default: Date.now },
  sector: { type: String },
  descripcion: { type: String },
  descripcionHTML: { type: String },
  resumenDescripcion: { type: String },
  videoURL: { type: String },
  recinto: { type: mongoose.Schema.Types.ObjectId, ref: 'Recinto', required: true },
  sala: { type: mongoose.Schema.Types.ObjectId, ref: 'Sala', required: true },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  modoVenta: { type: String },
  forzarRegistro: { type: Boolean, default: false },
  maxTicketsCompra: { type: Number, default: 10 },
  maxEntradasEmail: { type: Number, default: 0 },
  mostrarPrecioMinimo: { type: Boolean, default: false },
  mostrarPrecioDesdeConComision: { type: Boolean, default: false },
  mostrarPrecioDesdeSinComision: { type: Boolean, default: false },
  eventoSinLanding: { type: Boolean, default: false },
  forzarFlujoPromociones: { type: Boolean, default: false },
  eventoSinFecha: { type: Boolean, default: false },
  estadoVenta: {
    type: String,
    enum: [
      'a-la-venta',
      'solo-en-taquilla',
      'agotado',
      'proximamente',
      'proximamente-con-cuenta',
      'estado-personalizado'
    ],
    default: 'a-la-venta'
  },
  descripcionEstado: { type: String },
  estadoPersonalizado: { type: Boolean, default: false },
  mostrarDatosComprador: { type: Boolean, default: false },
  mostrarDatosBoleto: { type: Boolean, default: false },
  datosComprador: {
    nombre: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    email: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    telefono: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    rut: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    numeroIdentificacionFiscal: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    direccion: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    nombreFonetico: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    apellidosFoneticos: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    idioma: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    fechaNacimiento: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    sexo: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    empresa: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    departamento: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    cargoEmpresa: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    matricula: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    twitter: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    facebook: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    youtube: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    tiktok: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    snapchat: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    instagram: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    contactoEmergencia: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    },
    nacionalidad: {
      solicitado: { type: Boolean, default: false },
      obligatorio: { type: Boolean, default: false }
    }
  },
  datosBoleto: {
    rutTitular: { type: Boolean, default: false },
    idPasaporte: { type: Boolean, default: false },
    nombreTitular: { type: Boolean, default: false },
    verificarEmail: { type: Boolean, default: false },
    verificacionEmail: { type: Boolean, default: false },
    pregunta1: { type: Boolean, default: false },
    pregunta2: { type: Boolean, default: false }
  },
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
    habilitarMetodosPago: { type: Boolean, default: false },
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

// Generate slug from nombre if not provided
eventoSchema.pre('save', function(next) {
  if (!this.slug && this.nombre) {
    this.slug = slugify(this.nombre);
  } else if (this.slug) {
    this.slug = slugify(this.slug);
  }
  next();
});

export default mongoose.model('Evento', eventoSchema);
