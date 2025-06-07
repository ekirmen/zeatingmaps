import Evento from '../models/Evento.js';
import path from 'path';
import fs from 'fs';

const handleImageUpload = (file, fieldName) => {
  if (!file) return null;
  
  const finalPath = path.join('public', 'uploads', 'eventos', fieldName);
  if (!fs.existsSync(finalPath)) {
    fs.mkdirSync(finalPath, { recursive: true });
  }

  const newPath = path.join(finalPath, file.filename);
  fs.renameSync(file.path, newPath);
  
  return `/uploads/eventos/${fieldName}/${file.filename}`;
};

export const createEvento = async (req, res) => {
  try {
    const eventoData = JSON.parse(req.body.data || '{}');
    
    // Handle image uploads
    if (req.files) {
      eventoData.imagenes = {
        banner: req.files.banner ? handleImageUpload(req.files.banner[0], 'banner') : null,
        obraImagen: req.files.obraImagen ? handleImageUpload(req.files.obraImagen[0], 'obraImagen') : null,
        portada: req.files.portada ? handleImageUpload(req.files.portada[0], 'portada') : null,
        espectaculo: req.files.espectaculo ? 
          req.files.espectaculo.map(file => handleImageUpload(file, 'espectaculo')) : 
          [],
        // Add new ticket format images
        logoHorizontal: req.files.logoHorizontal ? handleImageUpload(req.files.logoHorizontal[0], 'logoHorizontal') : null,
        logoVertical: req.files.logoVertical ? handleImageUpload(req.files.logoVertical[0], 'logoVertical') : null,
        bannerPublicidad: req.files.bannerPublicidad ? handleImageUpload(req.files.bannerPublicidad[0], 'bannerPublicidad') : null,
        logoCuadrado: req.files.logoCuadrado ? handleImageUpload(req.files.logoCuadrado[0], 'logoCuadrado') : null,
        logoPassbook: req.files.logoPassbook ? handleImageUpload(req.files.logoPassbook[0], 'logoPassbook') : null,
        passBookBanner: req.files.passBookBanner ? handleImageUpload(req.files.passBookBanner[0], 'passBookBanner') : null,
        icono: req.files.icono ? handleImageUpload(req.files.icono[0], 'icono') : null
      };
    }

    // Initialize configuracionBoletas if not present
    eventoData.configuracionBoletas = {
      formatosPDF: {
        habilitado: false,
        tipo: 'single'
      },
      formatoPassbook: false,
      impresionTaquilla: false,
      terminosLegales: ''
    };

    const evento = new Evento(eventoData);
    await evento.save();
    res.status(201).json(evento);
  } catch (error) {
    console.error('Error creating evento:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateEvento = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'No autorizado, token no proporcionado' });
    }

    const eventoData = JSON.parse(req.body.data || '{}');
    
    if (req.files) {
      eventoData.imagenes = eventoData.imagenes || {};
      
      // Add handling for all image types
      const imageTypes = [
        'banner', 'obraImagen', 'portada', 'logoHorizontal', 'logoVertical',
        'bannerPublicidad', 'logoCuadrado', 'logoPassbook', 'passBookBanner', 'icono'
      ];

      imageTypes.forEach(type => {
        if (req.files[type]) {
          eventoData.imagenes[type] = handleImageUpload(req.files[type][0], type);
        }
      });

      if (req.files.espectaculo) {
        eventoData.imagenes.espectaculo = req.files.espectaculo.map(file => 
          handleImageUpload(file, 'espectaculo')
        );
      }
    }

    const evento = await Evento.findByIdAndUpdate(
      req.params.id,
      eventoData,
      { new: true }
    );

    if (!evento) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    res.json(evento);
  } catch (error) {
    console.error('Error updating evento:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getEventos = async (req, res) => {
  try {
    const eventos = await Evento.find();
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEventoById = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) {
      return res.status(404).json({ message: 'Evento not found' });
    }
    res.json(evento);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEvento = async (req, res) => {
  try {
    const evento = await Evento.findByIdAndDelete(req.params.id);
    if (!evento) {
      return res.status(404).json({ message: 'Evento not found' });
    }
    res.json({ message: 'Evento deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadEventImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
    }

    const { id } = req.params;
    const { type } = req.body;
    
    const evento = await Evento.findById(id);
    if (!evento) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    const imageUrl = `/uploads/eventos/${type}/${req.file.filename}`;

    if (!evento.imagenes) {
      evento.imagenes = {};
    }

    if (type === 'espectaculo') {
      if (!evento.imagenes.espectaculo) {
        evento.imagenes.espectaculo = [];
      }
      evento.imagenes.espectaculo.push(imageUrl);
    } else {
      evento.imagenes[type] = imageUrl;
    }

    await evento.save();

    res.json({
      url: imageUrl,
      message: 'Imagen subida correctamente',
      evento: evento
    });

  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({
      message: 'Error en el servidor',
      error: error.message
    });
  }
};
