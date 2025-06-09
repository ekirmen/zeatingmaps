import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMasksTheater, faFilm, faMusic, faFutbol, faImage, faBuilding, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { useTags } from '../../contexts/TagContext';

const DatosBasicos = ({ eventoData, setEventoData }) => {
  const [form, setForm] = useState({
    nombre: eventoData?.nombre || '',
    sector: eventoData?.sector || '',
    descripcion: eventoData?.descripcion || '',
    activo: eventoData?.activo ?? true,
    oculto: eventoData?.oculto ?? false,
    desactivado: eventoData?.desactivado ?? false,
    tags: eventoData?.tags || []
  });

  const { tags } = useTags();
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
    if (selectedTag && !form.tags.includes(selectedTag)) {
      const updated = [...form.tags, selectedTag];
      setForm(prev => ({ ...prev, tags: updated }));
      setEventoData(prev => ({ ...prev, tags: updated }));
      setSelectedTag('');
    }
  };

  const handleRemoveTag = (id) => {
    const updated = form.tags.filter(t => t !== id);
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
              {tags.map(tag => (
                <option key={tag._id} value={tag._id}>{tag.name}</option>
              ))}
            </select>
            <button type="button" onClick={handleTagAdd} className="px-3 py-1 bg-blue-600 text-white rounded">Añadir</button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {form.tags.map(id => {
              const t = tags.find(tag => tag._id === id);
              return (
                <span key={id} className="bg-gray-200 px-2 py-1 rounded flex items-center">
                  {t ? t.name : id}
                  <button type="button" className="ml-2" onClick={() => handleRemoveTag(id)}>&times;</button>
                </span>
              );
            })}
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
