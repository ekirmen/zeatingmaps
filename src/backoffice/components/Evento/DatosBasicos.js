import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMasksTheater, faFilm, faMusic, faFutbol, faImage, faBuilding, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { useTags } from '../../contexts/TagContext';

const MAX_TAGS = 3;

const DatosBasicos = ({ eventoData, setEventoData }) => {
  // Función para normalizar el campo tags
  const normalizeTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const [form, setForm] = useState({
    nombre: eventoData?.nombre || '',
    slug: eventoData?.slug || '',
    sector: eventoData?.sector || '',
    sectorPersonalizado: eventoData?.sectorPersonalizado || '',
    descripcion: eventoData?.descripcion || '',
    activo: eventoData?.activo ?? true,
    oculto: eventoData?.oculto ?? false,
    desactivado: eventoData?.desactivado ?? false,
    tags: normalizeTags(eventoData?.tags)
  });

  // Sync local form state whenever the selected event changes
  useEffect(() => {
    console.log('🔍 [DatosBasicos] eventoData recibido:', eventoData);
    console.log('🔍 [DatosBasicos] tags originales:', eventoData?.tags);
    console.log('🔍 [DatosBasicos] tags normalizados:', normalizeTags(eventoData?.tags));
    
    setForm({
      nombre: eventoData?.nombre || '',
      slug: eventoData?.slug || '',
      sector: eventoData?.sector || '',
      sectorPersonalizado: eventoData?.sectorPersonalizado || '',
      descripcion: eventoData?.descripcion || '',
      activo: eventoData?.activo ?? true,
      oculto: eventoData?.oculto ?? false,
      desactivado: eventoData?.desactivado ?? false,
      tags: normalizeTags(eventoData?.tags)
    });
  }, [eventoData]);

  // Manejo seguro de useTags
  let tags = [];
  try {
    const tagsContext = useTags();
    tags = tagsContext.tags || [];
  } catch (error) {
    console.warn('TagProvider no disponible, usando tags vacíos');
    tags = [];
  }
  
  const [selectedTag, setSelectedTag] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setForm({ ...form, [name]: newValue });
    setEventoData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSectorSelect = (label) => {
    if (label === 'Otros') {
      // Si se selecciona "Otros", limpiar el sector personalizado si no hay uno
      if (!form.sectorPersonalizado) {
        setForm(prev => ({ ...prev, sector: label, sectorPersonalizado: '' }));
        setEventoData(prev => ({ ...prev, sector: label, sectorPersonalizado: '' }));
      } else {
        setForm(prev => ({ ...prev, sector: label }));
        setEventoData(prev => ({ ...prev, sector: label }));
      }
    } else {
      // Si se selecciona otro sector, limpiar el personalizado
      setForm(prev => ({ ...prev, sector: label, sectorPersonalizado: '' }));
      setEventoData(prev => ({ ...prev, sector: label, sectorPersonalizado: '' }));
    }
  };

  const handleSectorPersonalizadoChange = (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, sectorPersonalizado: value }));
    setEventoData(prev => ({ ...prev, sectorPersonalizado: value }));
  };

  const handleTagAdd = () => {
    if (!selectedTag || form.tags.includes(selectedTag)) return;
    if (form.tags.length >= MAX_TAGS) {
      alert(`Solo puedes añadir hasta ${MAX_TAGS} tags.`);
      return;
    }

    // Asegurar que form.tags sea un array
    const currentTags = Array.isArray(form.tags) ? form.tags : [];
    const updated = [...currentTags, selectedTag];
    
    console.log('🔍 [DatosBasicos] Añadiendo tag:', selectedTag);
    console.log('🔍 [DatosBasicos] Tags actualizados:', updated);
    
    setForm(prev => ({ ...prev, tags: updated }));
    setEventoData(prev => ({ ...prev, tags: updated }));
    setSelectedTag('');
  };

  const handleRemoveTag = (id) => {
    // Asegurar que form.tags sea un array
    const currentTags = Array.isArray(form.tags) ? form.tags : [];
    const updated = currentTags.filter(t => t !== id);
    
    console.log('🔍 [DatosBasicos] Eliminando tag:', id);
    console.log('🔍 [DatosBasicos] Tags actualizados:', updated);
    
    setForm(prev => ({ ...prev, tags: updated }));
    setEventoData(prev => ({ ...prev, tags: updated }));
  };

  return (
    <div className="datos-basicos">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Datos Básicos del Evento</h3>
        <p className="text-gray-600">Configura la información fundamental de tu evento</p>
      </div>
      <form className="formulario-datos-basicos space-y-6">
        <div className="form-group mb-6">
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Evento:
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-700 placeholder-gray-400"
            placeholder="Ingresa el nombre de tu evento"
          />
        </div>

        <div className="form-group mb-6">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
            URL amigable:
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={form.slug}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-700 placeholder-gray-400"
            placeholder="nombre-del-evento"
          />
          <p className="text-xs text-gray-500 mt-2">
            Esta será la URL que aparecerá en el navegador
          </p>
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-3">Sector:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {[
              { id: 1, label: 'Artes escénicas', icon: faMasksTheater },
              { id: 2, label: 'Cine', icon: faFilm },
              { id: 3, label: 'Música', icon: faMusic },
              { id: 4, label: 'Deportes', icon: faFutbol },
              { id: 5, label: 'Exposiciones', icon: faImage },
              { id: 6, label: 'Ferias', icon: faBuilding },
              { id: 8, label: 'Otros', icon: faEllipsis }
            ].map(s => (
              <div
                key={s.id}
                className={`contenedor-sector cursor-pointer p-4 border-2 rounded-xl flex flex-col items-center justify-center transition-all duration-200 hover:shadow-md ${
                  form.sector === s.label 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-600 shadow-lg' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSectorSelect(s.label)}
              >
                <div className="obj-sector mb-2">
                  <FontAwesomeIcon icon={s.icon} className={`ico-sector text-xl ${form.sector === s.label ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <label className="text-sm font-medium text-center leading-tight">{s.label}</label>
              </div>
            ))}
          </div>
          
          {/* Campo de sector personalizado */}
          {form.sector === 'Otros' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <label htmlFor="sectorPersonalizado" className="block text-sm font-medium text-blue-800 mb-2">
                Especifica tu sector:
              </label>
              <input
                type="text"
                id="sectorPersonalizado"
                name="sectorPersonalizado"
                value={form.sectorPersonalizado}
                onChange={handleSectorPersonalizadoChange}
                placeholder="Ej: Tecnología, Gastronomía, Educación..."
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-700 placeholder-gray-400"
              />
              <p className="text-xs text-blue-600 mt-2">
                Escribe el nombre del sector que mejor describa tu evento
              </p>
            </div>
          )}
          
          {/* Mostrar sector seleccionado */}
          {form.sector && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Sector seleccionado:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {form.sector === 'Otros' && form.sectorPersonalizado 
                    ? form.sectorPersonalizado 
                    : form.sector
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="form-group mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Tags:</label>
          <div className="flex items-center gap-3 mb-3">
            <select 
              value={selectedTag} 
              onChange={e => setSelectedTag(e.target.value)} 
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-700"
            >
              <option value="">Seleccionar tag</option>
              {Array.isArray(tags) && tags.map(tag => (
                <option key={tag._id} value={tag._id}>{tag.name}</option>
              ))}
            </select>
            <button 
              type="button" 
              onClick={handleTagAdd} 
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Añadir
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(form.tags) && form.tags.length > 0 ? (
              form.tags.map(id => {
                const t = tags.find(tag => tag._id === id);
                return (
                  <span key={id} className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-2 rounded-full flex items-center gap-2 border border-blue-200">
                    <span className="text-sm font-medium">{t ? t.name : id}</span>
                    <button 
                      type="button" 
                      className="w-5 h-5 bg-blue-200 hover:bg-blue-300 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold transition-colors" 
                      onClick={() => handleRemoveTag(id)}
                    >
                      ×
                    </button>
                  </span>
                );
              })
            ) : (
              <span className="text-gray-500 text-sm italic">No hay tags seleccionados</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Los tags ayudan a categorizar y encontrar tu evento más fácilmente
          </p>
        </div>

        <div className="form-group mb-6">
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción:
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-700 placeholder-gray-400 resize-none"
            placeholder="Describe brevemente tu evento..."
          />
          <p className="text-xs text-gray-500 mt-2">
            Una descripción clara ayuda a los usuarios a entender de qué se trata tu evento
          </p>
        </div>

        <div className="form-group mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Configuración del Evento:</label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                name="activo"
                checked={form.activo}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Activo</span>
                <p className="text-xs text-gray-500">El evento estará disponible para los usuarios</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                name="oculto"
                checked={form.oculto}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Oculto</span>
                <p className="text-xs text-gray-500">El evento no aparecerá en listados públicos</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                name="desactivado"
                checked={form.desactivado}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Desactivado</span>
                <p className="text-xs text-gray-500">El evento estará completamente deshabilitado</p>
              </div>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DatosBasicos;
