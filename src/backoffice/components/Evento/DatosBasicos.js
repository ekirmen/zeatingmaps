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
    setForm(prev => ({ ...prev, sector: label }));
    setEventoData(prev => ({ ...prev, sector: label }));
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
      <h3>Datos Básicos del Evento</h3>
      <form className="formulario-datos-basicos">
        <div className="form-group">
          <label htmlFor="nombre">Nombre del Evento:</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="slug">URL amigable:</label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={form.slug}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Sector:</label>
          <div className="large-12 columns noPadding flex flex-wrap gap-2 mt-2">
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
                className={`contenedor-sector cursor-pointer p-2 border rounded flex flex-col items-center justify-center w-28 ${form.sector === s.label ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                onClick={() => handleSectorSelect(s.label)}
              >
                <div className="obj-sector mb-1">
                  <FontAwesomeIcon icon={s.icon} className="ico-sector" />
                </div>
                <label className="text-xs text-center">{s.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group mt-4">
          <label>Tags:</label>
          <div className="flex items-center gap-2 mt-1">
            <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} className="p-2 border rounded">
              <option value="">Seleccionar tag</option>
              {Array.isArray(tags) && tags.map(tag => (
                <option key={tag._id} value={tag._id}>{tag.name}</option>
              ))}
            </select>
            <button type="button" onClick={handleTagAdd} className="px-3 py-1 bg-blue-600 text-white rounded">Añadir</button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.isArray(form.tags) && form.tags.length > 0 ? (
              form.tags.map(id => {
                const t = tags.find(tag => tag._id === id);
                return (
                  <span key={id} className="bg-gray-200 px-2 py-1 rounded flex items-center">
                    {t ? t.name : id}
                    <button type="button" className="ml-2" onClick={() => handleRemoveTag(id)}>&times;</button>
                  </span>
                );
              })
            ) : (
              <span className="text-gray-500 text-sm">No hay tags seleccionados</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Descripción:</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
          />
        </div>

        <div className="form-group checkboxes">
          <label>
            <input
              type="checkbox"
              name="activo"
              checked={form.activo}
              onChange={handleChange}
            />
            Activo
          </label>
          <label>
            <input
              type="checkbox"
              name="oculto"
              checked={form.oculto}
              onChange={handleChange}
            />
            Oculto
          </label>
          <label>
            <input
              type="checkbox"
              name="desactivado"
              checked={form.desactivado}
              onChange={handleChange}
            />
            Desactivado
          </label>
        </div>
      </form>
    </div>
  );
};

export default DatosBasicos;
