import React, { useEffect, useState } from 'react';

/**
 * Advanced options for an event.  Currently exposes fields that are not part of
 * the basic configuration such as the user that created or last updated the
 * event.  The component keeps its own form state and syncs it with the parent
 * via `setEventoData`.
 */
const OpcionesAvanzadas = ({ eventoData, setEventoData }) => {
  const [form, setForm] = useState({
    creadoPor: eventoData?.creadoPor || '',
    actualizadoPor: eventoData?.actualizadoPor || '',
  });

  // When the selected event changes, update local form state
  useEffect(() => {
    setForm({
      creadoPor: eventoData?.creadoPor || '',
      actualizadoPor: eventoData?.actualizadoPor || '',
    });
  }, [eventoData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setEventoData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="tab-content opciones-avanzadas space-y-4">
      <h3>Opciones avanzadas</h3>

      <div className="form-group">
        <label htmlFor="creadoPor">Creado por</label>
        <input
          id="creadoPor"
          name="creadoPor"
          type="text"
          value={form.creadoPor}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="actualizadoPor">Actualizado por</label>
        <input
          id="actualizadoPor"
          name="actualizadoPor"
          type="text"
          value={form.actualizadoPor}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default OpcionesAvanzadas;
