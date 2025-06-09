import React, { useEffect, useState } from 'react';

/**
 * Advanced options for an event.  Handles optional messages and payment
 * method configuration.  The component keeps its own form state and syncs it
 * with the parent via `setEventoData`.
 */
const OpcionesAvanzadas = ({ eventoData, setEventoData }) => {
  const [metodos, setMetodos] = useState([]);
  const [form, setForm] = useState({
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
      },
      habilitarMetodosPago:
        eventoData?.otrasOpciones?.habilitarMetodosPago || false,
      metodosPagoPermitidos:
        eventoData?.otrasOpciones?.metodosPagoPermitidos || []
    }
  });

  // Fetch available payment methods on mount
  useEffect(() => {
    const fetchMetodos = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/metodos_pago');
        const data = await res.json();
        setMetodos(data);

        const activos = data.filter(m => m.activo).map(m => m.metodo);
        if (activos.length) {
          setForm(prev => ({
            ...prev,
            otrasOpciones: {
              ...prev.otrasOpciones,
              metodosPagoPermitidos: activos
            }
          }));
          setEventoData(prev => ({
            ...prev,
            otrasOpciones: {
              ...prev.otrasOpciones,
              metodosPagoPermitidos: activos
            }
          }));
        }
      } catch (e) {
        console.error('Error cargando métodos de pago', e);
      }
    };
    fetchMetodos();
  }, []);

  // When the selected event changes, update local form state
  useEffect(() => {
    setForm({
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
        },
        habilitarMetodosPago:
          eventoData?.otrasOpciones?.habilitarMetodosPago || false,
        metodosPagoPermitidos:
          eventoData?.otrasOpciones?.metodosPagoPermitidos || []
      }
    });
  }, [eventoData]);


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

  const handleMetodoToggle = (metodo) => {
    setForm(prev => {
      const seleccionado = prev.otrasOpciones.metodosPagoPermitidos.includes(metodo);
      const nuevos = seleccionado
        ? prev.otrasOpciones.metodosPagoPermitidos.filter(m => m !== metodo)
        : [...prev.otrasOpciones.metodosPagoPermitidos, metodo];
      const updated = {
        ...prev,
        otrasOpciones: {
          ...prev.otrasOpciones,
          metodosPagoPermitidos: nuevos
        }
      };
      setEventoData(ePrev => ({
        ...ePrev,
        otrasOpciones: {
          ...ePrev.otrasOpciones,
          metodosPagoPermitidos: nuevos
        }
      }));
      return updated;
    });
  };

  const handleMetodosPagoCheck = (e) => {
    const checked = e.target.checked;
    setForm(prev => ({
      ...prev,
      otrasOpciones: {
        ...prev.otrasOpciones,
        habilitarMetodosPago: checked
      }
    }));
    setEventoData(prev => ({
      ...prev,
      otrasOpciones: {
        ...prev.otrasOpciones,
        habilitarMetodosPago: checked
      }
    }));
  };

  return (
    <div className="tab-content opciones-avanzadas space-y-4">
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
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
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
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
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
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            value={form.otrasOpciones.popupAntesAsiento.texto}
            onChange={handleOtherOptionsChange('popupAntesAsiento', 'texto')}
          />
        )}
      </div>

      <div className="form-group space-y-2">
        <label>
          <input
            type="checkbox"
            checked={form.otrasOpciones.habilitarMetodosPago}
            onChange={handleMetodosPagoCheck}
          />
          {' '}Métodos de pago permitidos
        </label>
        {form.otrasOpciones.habilitarMetodosPago && (
          <div className="flex flex-col gap-1">
            {metodos.map(m => (
              <label key={m._id} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.otrasOpciones.metodosPagoPermitidos.includes(m.metodo)}
                  onChange={() => handleMetodoToggle(m.metodo)}
                />
                {m.metodo}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpcionesAvanzadas;
