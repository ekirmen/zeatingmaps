import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import API_BASE_URL from '../../../utils/apiBase';
import { FaFacebookF } from 'react-icons/fa';

/**
 * Advanced options for an event.  Handles optional messages and payment
 * method configuration.  The component keeps its own form state and syncs it
 * with the parent via `setEventoData`.
 */
const OpcionesAvanzadas = ({ eventoData, setEventoData }) => {
  const [metodos, setMetodos] = useState([]);
  if (typeof document !== 'undefined' && document.getElementById('root')) {
    Modal.setAppElement('#root');
  }
  const [showHelp, setShowHelp] = useState(false);
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
    },
    analytics: {
      enabled: eventoData?.analytics?.enabled || false,
      gtmId: eventoData?.analytics?.gtmId || '',
      metaPixelId: eventoData?.analytics?.metaPixelId || '',
      metaAccessToken: eventoData?.analytics?.metaAccessToken || ''
    }
  });

  // Fetch available payment methods on mount
  useEffect(() => {
    const fetchMetodos = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/metodos_pago`);
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
  }, [setEventoData]);

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
      },
      analytics: {
        enabled: eventoData?.analytics?.enabled || false,
        gtmId: eventoData?.analytics?.gtmId || '',
        metaPixelId: eventoData?.analytics?.metaPixelId || '',
        metaAccessToken: eventoData?.analytics?.metaAccessToken || ''
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

  const handleAnalyticsToggle = (e) => {
    const checked = e.target.checked;
    setForm(prev => ({
      ...prev,
      analytics: { ...prev.analytics, enabled: checked }
    }));
    setEventoData(prev => ({
      ...prev,
      analytics: { ...prev.analytics, enabled: checked }
    }));
  };

  const handleAnalyticsFieldChange = (field) => (e) => {
    const value = e.target.value;
    setForm(prev => ({
      ...prev,
      analytics: { ...prev.analytics, [field]: value }
    }));
    setEventoData(prev => ({
      ...prev,
      analytics: { ...prev.analytics, [field]: value }
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

      <h4>Analítica</h4>

      <div className="form-group space-y-2">
        <label>
          <input
            type="checkbox"
            checked={form.analytics.enabled}
            onChange={handleAnalyticsToggle}
          />{' '}
          Seguimiento
        </label>
      </div>

      {form.analytics.enabled && (
        <>
          <div className="form-group space-y-1">
            <label>ID de Google Tag Manager</label>
            <input
              type="text"
              placeholder="GTM-XXXXXXX"
              value={form.analytics.gtmId}
              onChange={handleAnalyticsFieldChange('gtmId')}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500">En caso de que tengas una cuenta GTM a nivel de empresa será sustituida por esta.</p>
          </div>

          <div className="form-group space-y-1">
            <label className="flex items-center gap-2">
              <FaFacebookF /> Código Meta Pixel
            </label>
            <input
              type="text"
              placeholder="1513047326679375"
              value={form.analytics.metaPixelId}
              onChange={handleAnalyticsFieldChange('metaPixelId')}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="form-group space-y-1">
            <label>API Access Token</label>
            <input
              type="text"
              value={form.analytics.metaAccessToken}
              onChange={handleAnalyticsFieldChange('metaAccessToken')}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="text-sm text-blue-600 underline"
            >
              Ayuda
            </button>
          </div>

          <Modal
            isOpen={showHelp}
            onRequestClose={() => setShowHelp(false)}
            contentLabel="Meta Pixel Help"
            className="modal"
            overlayClassName="modal-overlay"
          >
            <div className="bg-white p-6 rounded-md max-w-lg mx-auto">
              <h2 className="text-xl font-bold mb-4">META PIXEL CODE</h2>
              <p className="mb-2">Allows you to track visitors activity on the website, manage Meta ads, measure ad effectiveness, target users, dynamic ad campaigns, and analyze web login/ticket sales effectiveness.</p>
              <p className="font-semibold mb-1">Step 1: Create a Meta Pixel</p>
              <ol className="list-decimal list-inside space-y-1 mb-3 text-sm">
                <li>Go to events manager: <a className="text-blue-600 underline" href="https://www.facebook.com/events_manager" target="_blank" rel="noreferrer">https://www.facebook.com/events_manager</a>.</li>
                <li>Click on "Connect data origins" and select "Web".</li>
                <li>Select "Meta Pixel" and click "Connect".</li>
                <li>Add the name of the pixel.</li>
                <li>Insert your website's URL to see simple configuration options.</li>
                <li>Click "Continue".</li>
              </ol>
              <p className="font-semibold mb-1">Step 2: Add the Meta Pixel to your website</p>
              <ol className="list-decimal list-inside space-y-1 mb-4 text-sm">
                <li>Select "Install code manually".</li>
                <li>Copy the pixel base code.</li>
                <li>Paste that code in the textbox below.</li>
              </ol>
              <p>"Organizations" &gt; "Advanced" &gt; "Meta Pixel Code"</p>
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={() => setShowHelp(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};

export default OpcionesAvanzadas;
