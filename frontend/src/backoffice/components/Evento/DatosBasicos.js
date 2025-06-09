import React, { useState } from 'react';

const DatosBasicos = ({ eventoData, setEventoData }) => {
  const [form, setForm] = useState({
    nombre: eventoData?.nombre || '',
    sector: eventoData?.sector || '',
    descripcion: eventoData?.descripcion || '',
    activo: eventoData?.activo ?? true,
    oculto: eventoData?.oculto ?? false,
    desactivado: eventoData?.desactivado ?? false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setForm({ ...form, [name]: newValue });
    setEventoData(prev => ({ ...prev, [name]: newValue }));
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
          <label htmlFor="sector">Sector:</label>
          <input
            type="text"
            id="sector"
            name="sector"
            value={form.sector}
            onChange={handleChange}
          />
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
