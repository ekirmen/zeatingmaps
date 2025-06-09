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
    otrasOpciones: {
      observacionesEmail: {
        mostrar: eventoData?.otrasOpciones?.observacionesEmail?.mostrar || false,
        texto: eventoData?.otrasOpciones?.observacionesEmail?.texto || ''
      },
      observacionesCompra: {
        mostrar:
          eventoData?.otrasOpciones?.observacionesCompra?.mostrar || false,
        texto: eventoData?.otrasOpciones?.observacionesCompra?.texto || ''
      },
      popupAntesAsiento: {
        mostrar: eventoData?.otrasOpciones?.popupAntesAsiento?.mostrar || false,
        texto: eventoData?.otrasOpciones?.popupAntesAsiento?.texto || ''
      }
    }
  });

  // When the selected event changes, update local form state
  useEffect(() => {
    setForm({
      creadoPor: eventoData?.creadoPor || '',
      actualizadoPor: eventoData?.actualizadoPor || '',
      otrasOpciones: {
        observacionesEmail: {
          mostrar:
            eventoData?.otrasOpciones?.observacionesEmail?.mostrar || false,
          texto: eventoData?.otrasOpciones?.observacionesEmail?.texto || ''
        },
        observacionesCompra: {
          mostrar:
            eventoData?.otrasOpciones?.observacionesCompra?.mostrar || false,
          texto: eventoData?.otrasOpciones?.observacionesCompra?.texto || ''
        },
        popupAntesAsiento: {
          mostrar:
            eventoData?.otrasOpciones?.popupAntesAsiento?.mostrar || false,
          texto: eventoData?.otrasOpciones?.popupAntesAsiento?.texto || ''
        }
      }
    });
  }, [eventoData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setEventoData(prev => ({ ...prev, [name]: value }));
  };

  const handleOtherOptionsChange = (option, field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({
      ...prev,
      otrasOpciones: {
        ...prev.otrasOpciones,
        [option]: {
          ...prev.otrasOpciones[option],
          [field]: value
        }
      }
    }));
    setEventoData(prev => ({
      ...prev,
      otrasOpciones: {
        ...prev.otrasOpciones,
        [option]: {
          ...prev.otrasOpciones?.[option],
          [field]: value
        }
      }
    }));
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

      <h4>Otras opciones</h4>

      <div className="form-group space-y-2">
        <label>
          <input
            type="checkbox"
            checked={form.otrasOpciones.observacionesEmail.mostrar}
            onChange={handleOtherOptionsChange('observacionesEmail', 'mostrar')}
          />
          {' '}Mostrar observaciones en correo electrónico de confirmación
        </label>
        {form.otrasOpciones.observacionesEmail.mostrar && (
          <input
            type="text"
            value={form.otrasOpciones.observacionesEmail.texto}
            onChange={handleOtherOptionsChange('observacionesEmail', 'texto')}
          />
        )}
      </div>

      <div className="form-group space-y-2">
        <label>
          <input
            type="checkbox"
            checked={form.otrasOpciones.observacionesCompra.mostrar}
            onChange={handleOtherOptionsChange('observacionesCompra', 'mostrar')}
          />
          {' '}Mostrar observaciones en proceso de compra
        </label>
        {form.otrasOpciones.observacionesCompra.mostrar && (
          <input
            type="text"
            value={form.otrasOpciones.observacionesCompra.texto}
            onChange={handleOtherOptionsChange('observacionesCompra', 'texto')}
          />
        )}
      </div>

      <div className="form-group space-y-2">
        <label>
          <input
            type="checkbox"
            checked={form.otrasOpciones.popupAntesAsiento.mostrar}
            onChange={handleOtherOptionsChange('popupAntesAsiento', 'mostrar')}
          />
          {' '}Mostrar un pop-up bloqueante antes de seleccionar el asiento
        </label>
        {form.otrasOpciones.popupAntesAsiento.mostrar && (
          <input
            type="text"
            value={form.otrasOpciones.popupAntesAsiento.texto}
            onChange={handleOtherOptionsChange('popupAntesAsiento', 'texto')}
          />
        )}
      </div>
    </div>
  );
};

export default OpcionesAvanzadas;
