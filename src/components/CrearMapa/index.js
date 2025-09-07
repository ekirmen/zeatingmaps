// ===== SISTEMA COMPLETO DE CREAR-MAPA =====
// Este es el sistema más avanzado y completo para la creación de mapas de ticketera

import CrearMapaMain from './CrearMapaMain';
import CrearMapaEditor from './CrearMapaEditor';
import CrearMapaPreview from './CrearMapaPreview';
import CrearMapaValidation from './CrearMapaValidation';
import CrearMapaSettings from './CrearMapaSettings';
import ZonaManager from './ZonaManager';
import ContextMenu from './ContextMenu';
import MesaTypeMenu from './MesaTypeMenu';
import BackgroundFilterMenu from './BackgroundFilterMenu';
import BackgroundImageManager from './BackgroundImageManager';
import ImageUploader from './ImageUploader';
import MesaSillaManager from './MesaSillaManager';

export { 
  CrearMapaMain, 
  CrearMapaEditor, 
  CrearMapaPreview, 
  CrearMapaValidation, 
  CrearMapaSettings,
  ZonaManager,
  ContextMenu,
  MesaTypeMenu,
  BackgroundFilterMenu,
  BackgroundImageManager,
  ImageUploader,
  MesaSillaManager
};

// ===== FUNCIONES UTILITARIAS =====
export const crearMapaUtils = {
  // Generar ID único para elementos
  generateId: (prefix = 'element') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  // Validar posición de elemento
  validatePosition: (x, y, maxX = 10000, maxY = 10000) => {
    return typeof x === 'number' && typeof y === 'number' && 
           Math.abs(x) <= maxX && Math.abs(y) <= maxY;
  },
  
  // Calcular distancia entre dos puntos
  calculateDistance: (point1, point2) => {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) + 
      Math.pow(point1.y - point2.y, 2)
    );
  },
  
  // Ajustar a cuadrícula
  snapToGrid: (value, gridSize) => {
    return Math.round(value / gridSize) * gridSize;
  },
  
  // Generar colores aleatorios para zonas
  generateRandomColor: () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },
  
  // Exportar mapa como JSON
  exportToJSON: (mapa) => {
    const dataStr = JSON.stringify(mapa, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mapa.nombre || 'mapa'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
  
  // Importar mapa desde JSON
  importFromJSON: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const mapa = JSON.parse(e.target.result);
          resolve(mapa);
        } catch (error) {
          reject(new Error('Archivo JSON inválido'));
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file);
    });
  },
  
  // Validar estructura del mapa
  validateMapaStructure: (mapa) => {
    const errors = [];
    
    if (!mapa.nombre || mapa.nombre.trim().length < 3) {
      errors.push('El nombre del mapa debe tener al menos 3 caracteres');
    }
    
    if (!mapa.contenido || !mapa.contenido.elementos) {
      errors.push('El mapa debe tener contenido con elementos');
    }
    
    if (mapa.contenido?.elementos) {
      const elementos = mapa.contenido.elementos;
      
      // Verificar IDs únicos
      const ids = elementos.map(el => el._id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        errors.push('Hay elementos con IDs duplicados');
      }
      
      // Verificar posiciones válidas
      elementos.forEach((el, index) => {
        if (!el.posicion || typeof el.posicion.x !== 'number' || typeof el.posicion.y !== 'number') {
          errors.push(`Elemento ${index + 1} no tiene posición válida`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  // Optimizar mapa para rendimiento
  optimizeMapa: (mapa) => {
    const optimized = { ...mapa };
    
    if (optimized.contenido?.elementos) {
      // Remover propiedades innecesarias
      optimized.contenido.elementos = optimized.contenido.elementos.map(el => {
        const { _id, type, posicion, ...rest } = el;
        return { _id, type, posicion, ...rest };
      });
      
      // Ajustar posiciones a cuadrícula
      if (optimized.contenido.configuracion?.gridSize) {
        const gridSize = optimized.contenido.configuracion.gridSize;
        optimized.contenido.elementos.forEach(el => {
          if (el.posicion) {
            el.posicion.x = Math.round(el.posicion.x / gridSize) * gridSize;
            el.posicion.y = Math.round(el.posicion.y / gridSize) * gridSize;
          }
        });
      }
    }
    
    return optimized;
  },
  
  // Generar estadísticas del mapa
  generateMapaStats: (mapa) => {
    if (!mapa?.contenido?.elementos) return {};
    
    const elementos = mapa.contenido.elementos;
    const mesas = elementos.filter(el => el.type === 'mesa');
    const sillas = elementos.filter(el => el.type === 'silla');
    const conexiones = elementos.filter(el => el.type === 'conexion');
    const zonas = mapa.contenido.zonas || [];
    
    // Calcular área total
    let areaTotal = 0;
    mesas.forEach(mesa => {
      if (mesa.shape === 'rect' && mesa.width && mesa.height) {
        areaTotal += mesa.width * mesa.height;
      } else if (mesa.shape === 'circle' && mesa.radius) {
        areaTotal += Math.PI * Math.pow(mesa.radius, 2);
      }
    });
    
    // Calcular densidad de asientos
    const densidad = sillas.length > 0 ? (sillas.length / areaTotal) * 1000000 : 0;
    
    return {
      totalElementos: elementos.length,
      mesas: mesas.length,
      sillas: sillas.length,
      conexiones: conexiones.length,
      zonas: zonas.length,
      areaTotal: Math.round(areaTotal),
      densidadAsientos: Math.round(densidad * 100) / 100,
      dimensiones: mapa.contenido.configuracion?.dimensions || { width: 0, height: 0 },
      complejidad: elementos.length > 100 ? 'Alta' : elementos.length > 50 ? 'Media' : 'Baja'
    };
  },
  
  // Crear plantilla de mapa
  createMapaTemplate: (templateType = 'standard') => {
    const templates = {
      standard: {
        nombre: 'Mapa Estándar',
        descripcion: 'Plantilla estándar para eventos generales',
        contenido: {
          elementos: [],
          zonas: [
            { id: 'zona_1', nombre: 'Zona General', color: '#FF6B6B', precio: 0 },
            { id: 'zona_2', nombre: 'Zona VIP', color: '#4ECDC4', precio: 0 }
          ],
          configuracion: {
            gridSize: 20,
            showGrid: true,
            snapToGrid: true,
            background: null,
            dimensions: { width: 1200, height: 800 }
          }
        },
        estado: 'draft',
        metadata: {
          version: '1.0.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author: 'Sistema',
          tags: ['plantilla', 'estándar'],
          notes: 'Plantilla básica para comenzar'
        }
      },
      
      teatro: {
        nombre: 'Mapa de Teatro',
        descripcion: 'Plantilla optimizada para teatros y auditorios',
        contenido: {
          elementos: [],
          zonas: [
            { id: 'zona_1', nombre: 'Platea', color: '#FF6B6B', precio: 0 },
            { id: 'zona_2', nombre: 'Palco', color: '#4ECDC4', precio: 0 },
            { id: 'zona_3', nombre: 'Balcón', color: '#96CEB4', precio: 0 }
          ],
          configuracion: {
            gridSize: 15,
            showGrid: true,
            snapToGrid: true,
            background: null,
            dimensions: { width: 1000, height: 1200 }
          }
        },
        estado: 'draft',
        metadata: {
          version: '1.0.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author: 'Sistema',
          tags: ['plantilla', 'teatro', 'auditorio'],
          notes: 'Plantilla para teatros con disposición tradicional'
        }
      },
      
      restaurante: {
        nombre: 'Mapa de Restaurante',
        descripcion: 'Plantilla para restaurantes y eventos gastronómicos',
        contenido: {
          elementos: [],
          zonas: [
            { id: 'zona_1', nombre: 'Sala Principal', color: '#FF6B6B', precio: 0 },
            { id: 'zona_2', nombre: 'Terraza', color: '#4ECDC4', precio: 0 },
            { id: 'zona_3', nombre: 'Sala Privada', color: '#96CEB4', precio: 0 }
          ],
          configuracion: {
            gridSize: 25,
            showGrid: true,
            snapToGrid: true,
            background: null,
            dimensions: { width: 1400, height: 900 }
          }
        },
        estado: 'draft',
        metadata: {
          version: '1.0.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author: 'Sistema',
          tags: ['plantilla', 'restaurante', 'gastronomía'],
          notes: 'Plantilla para restaurantes con mesas y sillas'
        }
      },
      
      concierto: {
        nombre: 'Concierto',
        descripcion: 'Configuración para conciertos y eventos musicales',
        contenido: {
          elementos: [],
          zonas: [
            { id: 'zona_1', nombre: 'Floor', color: '#FF6B6B', precio: 200.00 },
            { id: 'zona_2', nombre: 'Tier 1', color: '#4ECDC4', precio: 150.00 },
            { id: 'zona_3', nombre: 'Tier 2', color: '#96CEB4', precio: 100.00 },
            { id: 'zona_4', nombre: 'VIP', color: '#FFD700', precio: 300.00 }
          ],
          configuracion: {
            gridSize: 25,
            showGrid: true,
            snapToGrid: true,
            background: null,
            dimensions: { width: 1600, height: 1000 },
            seatSize: { width: 50, height: 45 },
            spacing: { x: 55, y: 50 }
          }
        },
        estado: 'draft',
        metadata: {
          version: '1.0.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author: 'Sistema',
          tags: ['plantilla', 'concierto', 'música'],
          notes: 'Plantilla para conciertos con zonas diferenciadas'
        }
      },
      
      estadio: {
        nombre: 'Estadio Deportivo',
        descripcion: 'Configuración para estadios y arenas deportivas',
        contenido: {
          elementos: [],
          zonas: [
            { id: 'zona_1', nombre: 'Field', color: '#FF6B6B', precio: 80.00 },
            { id: 'zona_2', nombre: 'Stands', color: '#4ECDC4', precio: 60.00 },
            { id: 'zona_3', nombre: 'Premium', color: '#96CEB4', precio: 120.00 }
          ],
          configuracion: {
            gridSize: 15,
            showGrid: true,
            snapToGrid: true,
            background: null,
            dimensions: { width: 2000, height: 1200 },
            seatSize: { width: 35, height: 30 },
            spacing: { x: 38, y: 33 }
          }
        },
        estado: 'draft',
        metadata: {
          version: '1.0.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author: 'Sistema',
          tags: ['plantilla', 'estadio', 'deportes'],
          notes: 'Plantilla para estadios deportivos con alta capacidad'
        }
      },
      
      conferencia: {
        nombre: 'Conferencia',
        descripcion: 'Configuración para conferencias y eventos corporativos',
        contenido: {
          elementos: [],
          zonas: [
            { id: 'zona_1', nombre: 'Main', color: '#FF6B6B', precio: 100.00 },
            { id: 'zona_2', nombre: 'Side', color: '#4ECDC4', precio: 80.00 },
            { id: 'zona_3', nombre: 'VIP', color: '#96CEB4', precio: 150.00 }
          ],
          configuracion: {
            gridSize: 20,
            showGrid: true,
            snapToGrid: true,
            background: null,
            dimensions: { width: 1200, height: 800 },
            seatSize: { width: 45, height: 40 },
            spacing: { x: 50, y: 45 }
          }
        },
        estado: 'draft',
        metadata: {
          version: '1.0.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author: 'Sistema',
          tags: ['plantilla', 'conferencia', 'corporativo'],
          notes: 'Plantilla para conferencias y eventos empresariales'
        }
      }
    };
    
    return templates[templateType] || templates.standard;
  }
};

// ===== CONSTANTES DEL SISTEMA =====
export const CREAR_MAPA_CONSTANTS = {
  // Tipos de elementos
  ELEMENT_TYPES: {
    MESA: 'mesa',
    SILLA: 'silla',
    CONEXION: 'conexion',
    BACKGROUND: 'background',
    ZONA: 'zona'
  },
  
  // Formas de elementos
  SHAPES: {
    RECT: 'rect',
    CIRCLE: 'circle',
    ELLIPSE: 'ellipse',
    POLYGON: 'polygon'
  },
  
  // Estados de asientos
  SEAT_STATES: {
    AVAILABLE: 'available',
    SELECTED: 'selected',
    OCCUPIED: 'occupied',
    BLOCKED: 'blocked',
    RESERVED: 'reserved'
  },
  
  // Niveles de seguridad
  SECURITY_LEVELS: {
    LOW: 'low',
    STANDARD: 'standard',
    HIGH: 'high',
    MAXIMUM: 'maximum'
  },
  
  // Control de acceso
  ACCESS_CONTROL: {
    PUBLIC: 'public',
    RESTRICTED: 'restricted',
    PRIVATE: 'private',
    ADMIN: 'admin'
  },
  
  // Formatos de exportación
  EXPORT_FORMATS: {
    PNG: 'png',
    JPG: 'jpg',
    PDF: 'pdf',
    SVG: 'svg',
    JSON: 'json',
    XML: 'xml'
  },
  
  // Límites del sistema
  LIMITS: {
    MAX_ELEMENTS: 10000,
    MAX_GRID_SIZE: 200,
    MAX_EXPORT_SIZE: 8192,
    MIN_DIMENSIONS: { width: 200, height: 200 },
    MAX_DIMENSIONS: { width: 5000, height: 5000 }
  }
};

// ===== HOOKS PERSONALIZADOS =====
export const useCrearMapa = () => {
  return {
    utils: crearMapaUtils,
    constants: CREAR_MAPA_CONSTANTS
  };
};

// ===== EXPORTACIÓN POR DEFECTO =====
export default CrearMapaMain;
