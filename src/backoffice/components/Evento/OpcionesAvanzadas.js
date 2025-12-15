import React, { useState, useEffect, useMemo } from 'react';
import Modal from 'react-modal';
import API_BASE_URL from '../../../utils/apiBase';
import { FaFacebookF } from 'react-icons/fa';
import { supabase } from '../../../supabaseClient';
import {
  CreditCardOutlined,
  BankOutlined,
  MobileOutlined,
  DollarOutlined,
  AppleOutlined,
  AndroidOutlined,
  ShopOutlined,
} from '@ant-design/icons';

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
        texto: eventoData?.otrasOpciones?.observacionesEmail?.texto || '',
      },
      observacionesCompra: {
        mostrar: eventoData?.otrasOpciones?.observacionesCompra?.mostrar || false,
        texto: eventoData?.otrasOpciones?.observacionesCompra?.texto || '',
      },
      popupAntesAsiento: {
        mostrar: eventoData?.otrasOpciones?.popupAntesAsiento?.mostrar || false,
        texto: eventoData?.otrasOpciones?.popupAntesAsiento?.texto || '',
      },
      habilitarMetodosPago: eventoData?.otrasOpciones?.habilitarMetodosPago || false,
      metodosPagoPermitidos: eventoData?.otrasOpciones?.metodosPagoPermitidos || [],
    },
    analytics: {
      enabled: eventoData?.analytics?.enabled || false,
      gtmId: eventoData?.analytics?.gtmId || '',
      metaPixelId: eventoData?.analytics?.metaPixelId || '',
      metaAccessToken: eventoData?.analytics?.metaAccessToken || '',
    },
  });

  // Métodos de pago disponibles con iconos
  const availableMethods = useMemo(
    () => [
      {
        id: 'stripe',
        name: 'Stripe',
        icon: <CreditCardOutlined style={{ color: '#6772e5' }} />,
        description: 'Tarjetas de crédito y débito',
        recommended: true,
      },
      {
        id: 'paypal',
        name: 'PayPal',
        icon: <DollarOutlined style={{ color: '#0070ba' }} />,
        description: 'Pagos a través de PayPal',
        recommended: true,
      },
      {
        id: 'cashea',
        name: 'Cashea',
        icon: <CreditCardOutlined style={{ color: '#111827' }} />,
        description: 'Compra ahora y paga después con Cashea',
        recommended: false,
      },
      {
        id: 'apple_pay',
        name: 'Apple Pay',
        icon: <AppleOutlined style={{ color: '#000000' }} />,
        description: 'Pagos para usuarios iOS',
        recommended: true,
      },
      {
        id: 'google_pay',
        name: 'Google Pay',
        icon: <AndroidOutlined style={{ color: '#4285f4' }} />,
        description: 'Pagos para usuarios Android',
        recommended: true,
      },
      {
        id: 'transferencia',
        name: 'Transferencia Bancaria',
        icon: <BankOutlined style={{ color: '#52c41a' }} />,
        description: 'Transferencias bancarias directas',
        recommended: false,
      },
      {
        id: 'pago_movil',
        name: 'Pago Móvil',
        icon: <MobileOutlined style={{ color: '#1890ff' }} />,
        description: 'Pagos móviles (MercadoPago, etc.)',
        recommended: false,
      },
      {
        id: 'efectivo_tienda',
        name: 'Pago en Efectivo en Tienda',
        icon: <ShopOutlined style={{ color: '#fa8c16' }} />,
        description: 'Pagos en efectivo en tienda física',
        recommended: false,
      },
      {
        id: 'efectivo',
        name: 'Efectivo',
        icon: <DollarOutlined style={{ color: '#fa8c16' }} />,
        description: 'Pagos en efectivo',
        recommended: false,
      },
    ],
    []
  );

  // Fetch available payment methods on mount
  useEffect(() => {
    let isSubscribed = true;

    const fetchMetodos = async () => {
      try {
        // Cargar métodos de pago desde Supabase
        const { data: methods, error } = await supabase.from('payment_methods').select('*');

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = tabla no existe
        }

        if (!isSubscribed) return;

        // Si no hay datos en la BD, usar los métodos por defecto (desactivados)
        if (!methods || methods.length === 0) {
          setMetodos(
            availableMethods.map(method => ({
              _id: method.id,
              metodo: method.name,
              activo: false, // Por defecto desactivados
              habilitado: false, // No habilitado en payment-gateways
              icon: method.icon,
              description: method.description,
            }))
          );
        } else {
          // Combinar con los métodos disponibles
          const combinedMethods = availableMethods.map(method => {
            const savedMethod = methods.find(m => m.method_id === method.id);
            const estaHabilitado = savedMethod ? savedMethod.enabled : false;
            return {
              _id: method.id,
              metodo: method.name,
              activo: estaHabilitado, // Activo solo si está habilitado en payment-gateways
              habilitado: estaHabilitado, // Indica si está habilitado en payment-gateways
              icon: method.icon,
              description: method.description,
            };
          });
          setMetodos(combinedMethods);
        }
      } catch (e) {
        console.error('Error cargando métodos de pago', e);
        if (!isSubscribed) return;
        // Fallback a métodos por defecto (desactivados)
        setMetodos(
          availableMethods.map(method => ({
            _id: method.id,
            metodo: method.name,
            activo: false, // Por defecto desactivados
            habilitado: false, // No habilitado en payment-gateways
            icon: method.icon,
            description: method.description,
          }))
        );
      }
    };

    fetchMetodos();

    return () => {
      isSubscribed = false;
    };
  }, [availableMethods]);

  useEffect(() => {
    if (!eventoData || metodos.length === 0) {
      return;
    }

    const selection = eventoData?.otrasOpciones?.metodosPagoPermitidos;
    const hasExplicitSelection = Array.isArray(selection) && selection.length > 0;
    const isExistingEvent = Boolean(eventoData?.id);

    // Obtener métodos habilitados en payment-gateways
    const metodosHabilitados = metodos.filter(m => m.habilitado === true).map(m => m._id);

    // Para eventos nuevos sin configuración explícita, activar TODOS los métodos habilitados en payment-gateways
    if (!isExistingEvent && !hasExplicitSelection) {
      setForm(prev => ({
        ...prev,
        otrasOpciones: {
          ...prev.otrasOpciones,
          metodosPagoPermitidos: [...metodosHabilitados], // Copia del array para evitar mutaciones
        },
      }));

      setEventoData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          otrasOpciones: {
            ...prev.otrasOpciones,
            metodosPagoPermitidos: [...metodosHabilitados], // Copia del array para evitar mutaciones
          },
        };
      });
    } else if (hasExplicitSelection && isExistingEvent) {
      // Para eventos existentes, filtrar métodos permitidos para que solo incluyan los habilitados
      // Pero mantener los que el usuario ya había seleccionado (aunque no estén habilitados globalmente)
      const metodosPermitidosFiltrados = selection.filter(m => {
        // Mantener si está habilitado globalmente O si ya estaba seleccionado (para no perder la selección del usuario)
        return metodosHabilitados.includes(m) || metodos.find(method => method._id === m);
      });

      // Solo actualizar si hay diferencias (para evitar loops infinitos)
      if (metodosPermitidosFiltrados.length !== selection.length) {
        setForm(prev => ({
          ...prev,
          otrasOpciones: {
            ...prev.otrasOpciones,
            metodosPagoPermitidos: metodosPermitidosFiltrados,
          },
        }));

        setEventoData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            otrasOpciones: {
              ...prev.otrasOpciones,
              metodosPagoPermitidos: metodosPermitidosFiltrados,
            },
          };
        });
      }
    }
  }, [eventoData, setEventoData, availableMethods, metodos]);

  // When the selected event changes, update local form state
  useEffect(() => {
    // Si es un evento nuevo y hay métodos habilitados, inicializar con todos los habilitados
    const isNewEvent = !eventoData?.id;
    const metodosHabilitados = metodos.filter(m => m.habilitado === true).map(m => m._id);

    const metodosPagoPermitidos =
      isNewEvent && metodosHabilitados.length > 0
        ? metodosHabilitados // Para eventos nuevos, activar todos los habilitados por defecto
        : eventoData?.otrasOpciones?.metodosPagoPermitidos || []; // Para eventos existentes, usar los guardados

    setForm({
      otrasOpciones: {
        observacionesEmail: {
          mostrar: eventoData?.otrasOpciones?.observacionesEmail?.mostrar || false,
          texto: eventoData?.otrasOpciones?.observacionesEmail?.texto || '',
        },
        observacionesCompra: {
          mostrar: eventoData?.otrasOpciones?.observacionesCompra?.mostrar || false,
          texto: eventoData?.otrasOpciones?.observacionesCompra?.texto || '',
        },
        popupAntesAsiento: {
          mostrar: eventoData?.otrasOpciones?.popupAntesAsiento?.mostrar || false,
          texto: eventoData?.otrasOpciones?.popupAntesAsiento?.texto || '',
        },
        habilitarMetodosPago: eventoData?.otrasOpciones?.habilitarMetodosPago || false,
        metodosPagoPermitidos: metodosPagoPermitidos,
      },
      analytics: {
        enabled: eventoData?.analytics?.enabled || false,
        gtmId: eventoData?.analytics?.gtmId || '',
        metaPixelId: eventoData?.analytics?.metaPixelId || '',
        metaAccessToken: eventoData?.analytics?.metaAccessToken || '',
      },
    });
  }, [eventoData]);

  const handleOtherOptionsChange = (option, field) => e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({
      ...prev,
      otrasOpciones: {
        ...prev.otrasOpciones,
        [option]: {
          ...prev.otrasOpciones[option],
          [field]: value,
        },
      },
    }));
    setEventoData(prev => ({
      ...prev,
      otrasOpciones: {
        ...prev.otrasOpciones,
        [option]: {
          ...prev.otrasOpciones?.[option],
          [field]: value,
        },
      },
    }));
  };

  const handleAnalyticsToggle = e => {
    const checked = e.target.checked;
    setForm(prev => ({
      ...prev,
      analytics: { ...prev.analytics, enabled: checked },
    }));
    setEventoData(prev => ({
      ...prev,
      analytics: { ...prev.analytics, enabled: checked },
    }));
  };

  const handleAnalyticsFieldChange = field => e => {
    const value = e.target.value;
    setForm(prev => ({
      ...prev,
      analytics: { ...prev.analytics, [field]: value },
    }));
    setEventoData(prev => ({
      ...prev,
      analytics: { ...prev.analytics, [field]: value },
    }));
  };

  const handleMetodoToggle = metodo => {
    const metodoInfo = metodos.find(m => m._id === metodo);
    if (!metodoInfo) {
      return;
    }

    setForm(prev => {
      const seleccionado = prev.otrasOpciones.metodosPagoPermitidos.includes(metodo);

      // Si está seleccionado, permitir desactivarlo (siempre)
      if (seleccionado) {
        const nuevos = prev.otrasOpciones.metodosPagoPermitidos.filter(m => m !== metodo);
        const updated = {
          ...prev,
          otrasOpciones: {
            ...prev.otrasOpciones,
            metodosPagoPermitidos: nuevos,
          },
        };
        setEventoData(ePrev => ({
          ...ePrev,
          otrasOpciones: {
            ...ePrev.otrasOpciones,
            metodosPagoPermitidos: nuevos,
          },
        }));
        return updated;
      }

      // Si no está seleccionado, solo permitir activarlo si está habilitado en payment-gateways
      if (!metodoInfo.habilitado) {
        // No permitir activar métodos que no están habilitados en payment-gateways
        return prev;
      }

      // Activar el método
      const nuevos = [...prev.otrasOpciones.metodosPagoPermitidos, metodo];
      const updated = {
        ...prev,
        otrasOpciones: {
          ...prev.otrasOpciones,
          metodosPagoPermitidos: nuevos,
        },
      };
      setEventoData(ePrev => ({
        ...ePrev,
        otrasOpciones: {
          ...ePrev.otrasOpciones,
          metodosPagoPermitidos: nuevos,
        },
      }));
      return updated;
    });
  };

  const handleMetodosPagoCheck = e => {
    const checked = e.target.checked;
    setForm(prev => ({
      ...prev,
      otrasOpciones: {
        ...prev.otrasOpciones,
        habilitarMetodosPago: checked,
      },
    }));
    setEventoData(prev => ({
      ...prev,
      otrasOpciones: {
        ...prev.otrasOpciones,
        habilitarMetodosPago: checked,
      },
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
          />{' '}
          Mostrar observaciones en correo electrónico de confirmación
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
          />{' '}
          Mostrar observaciones en proceso de compra
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
          />{' '}
          Mostrar un pop-up bloqueante antes de seleccionar el asiento
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
          />{' '}
          Métodos de pago permitidos
        </label>
        {form.otrasOpciones.habilitarMetodosPago && (
          <div className="flex flex-col gap-2">
            {metodos.map(m => {
              const isEnabled = m.habilitado === true;
              const isChecked = form.otrasOpciones.metodosPagoPermitidos.includes(m._id);
              // Solo deshabilitar si NO está habilitado en payment-gateways Y NO está seleccionado
              // Permitir desactivar métodos que ya están seleccionados aunque no estén habilitados
              const isDisabled = !isEnabled && !isChecked;

              return (
                <label
                  key={m._id}
                  className={`inline-flex items-center gap-3 p-2 border border-gray-200 rounded-md ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed bg-gray-100'
                      : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleMetodoToggle(m._id)}
                    disabled={isDisabled}
                    className="mr-2"
                  />
                  <span className="text-lg">{m.icon}</span>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{m.metodo}</span>
                    <span className="text-sm text-gray-500">{m.description}</span>
                    {isDisabled && (
                      <span className="text-xs text-red-500 mt-1">
                        Debe estar activado en /dashboard/payment-gateways
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
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
            <p className="text-xs text-gray-500">
              En caso de que tengas una cuenta GTM a nivel de empresa será sustituida por esta.
            </p>
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
              <p className="mb-2">
                Allows you to track visitors activity on the website, manage Meta ads, measure ad
                effectiveness, target users, dynamic ad campaigns, and analyze web login/ticket
                sales effectiveness.
              </p>
              <p className="font-semibold mb-1">Step 1: Create a Meta Pixel</p>
              <ol className="list-decimal list-inside space-y-1 mb-3 text-sm">
                <li>
                  Go to events manager:{' '}
                  <a
                    className="text-blue-600 underline"
                    href="https://www.facebook.com/events_manager"
                    target="_blank"
                    rel="noreferrer"
                  >
                    https://www.facebook.com/events_manager
                  </a>
                  .
                </li>
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
