// src/pages/Event.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { Modal, message } from 'antd';
import SeatingMap from '../components/SeatingMap'; // al inicio
import { fetchMapa, fetchPlantillaPrecios, getCmsPage } from '../services/apistore';
import EventListWidget from '../components/EventListWidget';
import FaqWidget from '../components/FaqWidget';
import { useTranslation } from 'react-i18next';
import { loadGtm, loadMetaPixel } from '../utils/analytics';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const Event = () => {
  const { eventId } = useParams(); // eventId puede ser slug o id real
  const navigate = useNavigate();
  const { refParam } = useRefParam();
  const { t } = useTranslation();

  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [plantillaPrecios, setPlantillaPrecios] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [showSeatPopup, setShowSeatPopup] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [widgets, setWidgets] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCmsPage('events');
        setWidgets(data.widgets);
        localStorage.setItem('cms-page-events', JSON.stringify(data.widgets));
      } catch (e) {
        const saved = localStorage.getItem('cms-page-events');
        if (saved) {
          try {
            setWidgets(JSON.parse(saved));
          } catch (err) {
            console.error('Error parsing widgets', err);
          }
        }
      }
    };
    load();
  }, []);

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'Listado de eventos':
        return <EventListWidget />;
      case 'Preguntas frecuentes':
        return <FaqWidget />;
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/events/${eventId}`);
        const data = await response.json();
        setEvento(data);
        if (data?.otrasOpciones?.popupAntesAsiento?.mostrar) {
          setShowSeatPopup(true);
        }
        if (data?.analytics?.enabled) {
          const { gtmId, metaPixelId } = data.analytics;
          loadGtm(gtmId);
          loadMetaPixel(metaPixelId);
          if (metaPixelId) localStorage.setItem('metaPixelId', metaPixelId);
          if (gtmId) localStorage.setItem('gtmId', gtmId);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      }
    };
    fetchEvento();
  }, [eventId]);

  useEffect(() => {
    const fetchFunciones = async () => {
      try {
        const id = evento?._id || eventId;
        const response = await fetch(
          `http://localhost:5000/api/funcions?evento=${id}`
        );
        const data = await response.json();
        setFunciones(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching functions:', error);
      }
    };
    if (evento?._id || eventId) fetchFunciones();
  }, [eventId, evento]);

  useEffect(() => {
    const fetchAllZonas = async () => {
      try {
        const id = evento?._id || eventId;
        const response = await fetch(
          `http://localhost:5000/api/funcions?evento=${id}`
        );
        const funciones = await response.json();

        if (!Array.isArray(funciones)) throw new Error("Funciones not found");
  
        // Extraer zonas de todas las plantillas
        const zonasMap = new Map();
  
        funciones.forEach((funcion) => {
          const detalles = funcion?.plantilla?.detalles || [];
          detalles.forEach((detalle) => {
            if (detalle.zonaId && !zonasMap.has(detalle.zonaId)) {
              zonasMap.set(detalle.zonaId, detalle);
            }
          });
        });
  
        const zonasUnicas = Array.from(zonasMap.values());
        setZonas(zonasUnicas); // Esto depende de cómo quieras estructurarlas visualmente
  
      } catch (error) {
        console.error("Error fetching zonas desde funciones:", error);
        message.error("Error al cargar zonas: " + error.message);
      }
    };
  
    if (evento?._id || eventId) fetchAllZonas();
  }, [eventId, evento]);
  
  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/payments');
        const data = await response.json();
        setPagos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching payments:', error);
        setPagos([]);
      }
    };
    fetchPagos();
  }, []);

  useEffect(() => {
    const cargarDatosSeleccionados = async () => {
      if (!selectedFunctionId) return;
      const funcion = funciones.find(f => f._id === selectedFunctionId);
      if (!funcion) return;

      try {
        const mapaData = await fetchMapa(funcion.sala._id, funcion._id);
        const mapaActualizado = {
          ...mapaData,
          contenido: mapaData.contenido.map(elemento => ({
            ...elemento,
            sillas: elemento.sillas.map(silla => {
              const pagoAsiento = pagos.find(pago =>
                Array.isArray(pago.seats) && pago.seats.some(seat => seat.id === silla._id)
              );

              if (pagoAsiento) {
                const estado = pagoAsiento.status;
                return {
                  ...silla,
                  estado,
                  color:
                    estado === "bloqueado" ? "orange" :
                    estado === "reservado" ? "red" :
                    estado === "pagado" ? "gray" : silla.color || "lightblue"
                };
              }
              return silla;
            })
          }))
        };

        setMapa(mapaActualizado);

        if (funcion.plantilla?.id || funcion.plantilla?._id) {
          const plantillaData = await fetchPlantillaPrecios(funcion.plantilla._id);
          setPlantillaPrecios(plantillaData);
        }
      } catch (error) {
        console.error('Error loading selected data:', error);
      }
    };
    cargarDatosSeleccionados();
  }, [selectedFunctionId, funciones, pagos]);

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) return;
    try {
      const res = await fetch(`http://localhost:5000/api/descuentos/code/${encodeURIComponent(discountCode.trim())}`);
      if (!res.ok) throw new Error('Código no válido');
      const data = await res.json();
      const now = Date.now();
      if (data.fechaInicio && new Date(data.fechaInicio).getTime() > now) throw new Error('Descuento no disponible aún');
      if (data.fechaFinal && new Date(data.fechaFinal).getTime() < now) throw new Error('Descuento expirado');
      setAppliedDiscount(data);
      message.success('Descuento aplicado');
    } catch (err) {
      setAppliedDiscount(null);
      message.error(err.message);
    }
  };

  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(15 * 60);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCarrito([]);
          message.info('Tiempo expirado, asientos liberados');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const toggleSillaEnCarrito = (silla, mesa) => {
    if (!silla.zona || ["reservado", "pagado", "bloqueado"].includes(silla.estado)) {
      message.error("Este asiento no está disponible.");
      return;
    }

    const index = carrito.findIndex(item => item._id === silla._id);
    if (index === -1 && evento?.maxTicketsCompra && carrito.length >= evento.maxTicketsCompra) {
      message.error(`Solo puedes seleccionar ${evento.maxTicketsCompra} asientos.`);
      return;
    }

    const basePrice = plantillaPrecios?.detalles.find(p => p.zonaId === silla.zona)?.precio || 100;
    const zonaNombre = zonas.find(z => z._id === silla.zona)?.nombre || "Desconocida";
    let finalPrice = basePrice;
    let tipoPrecio = 'normal';
    let descuentoNombre = '';
    if (appliedDiscount?.detalles) {
      const detalle = appliedDiscount.detalles.find(d => {
        const id = typeof d.zona === 'object' ? d.zona._id : d.zona;
        return id === silla.zona;
      });
      if (detalle) {
        if (detalle.tipo === 'porcentaje') {
          finalPrice = Math.max(0, basePrice - (basePrice * detalle.valor / 100));
        } else {
          finalPrice = Math.max(0, basePrice - detalle.valor);
        }
        tipoPrecio = 'descuento';
        descuentoNombre = appliedDiscount.nombreCodigo;
      }
    }
    const nuevoCarrito = index !== -1
      ? carrito.filter(item => item._id !== silla._id)
      : [...carrito, { ...silla, precio: finalPrice, nombreMesa: mesa.nombre, zonaNombre, tipoPrecio, descuentoNombre }];

    const wasEmpty = carrito.length === 0;
    setCarrito(nuevoCarrito);
    if (wasEmpty && nuevoCarrito.length > 0) {
      startTimer();
    }
    if (nuevoCarrito.length === 0) {
      clearInterval(timerRef.current);
      setTimeLeft(0);
    }

    const updatedMapa = {
      ...mapa,
      contenido: mapa.contenido.map(elemento => ({
        ...elemento,
        sillas: elemento.sillas.map(s => ({
          ...s,
          color: nuevoCarrito.some(item => item._id === s._id) ? "green" : s.color || "lightblue"
        }))
      }))
    };

    setMapa(updatedMapa);
  };


  return (
    <div className="p-4">
      {timeLeft > 0 && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm">Tiempo restante de reserva:</p>
          <p className="text-xl font-mono">
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </p>
        </div>
      )}

      <h1 className="text-2xl font-bold text-center my-4">{evento?.nombre}</h1>

      {evento?.imagenes?.banner && (
        <img
          src={`${API_URL}${evento.imagenes.banner}`}
          alt={`Banner de ${evento.nombre}`}
          className="w-full max-h-[80vh] object-contain rounded mb-4"
        />
      )}

      {evento?.imagenes?.portada && (
        <img
          src={`${API_URL}${evento.imagenes.portada}`}
          alt={`Portada de ${evento.nombre}`}
          className="w-full max-h-[80vh] object-contain rounded mb-4"
        />
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Funciones</h3>
        <div className="flex flex-col gap-2">
          {funciones.map(funcion => (
            <label key={funcion._id} className="flex items-center gap-2">
              <input
                type="radio"
                name="funcion"
                value={funcion._id}
                onChange={() => setSelectedFunctionId(funcion._id)}
              />
              <span>{funcion.evento?.nombre} - {new Date(funcion.fechaCelebracion).toLocaleString()}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4 flex gap-2 items-center">
        <input
          type="text"
          value={discountCode}
          onChange={e => setDiscountCode(e.target.value)}
          placeholder={t('discount.placeholder')}
          className="border px-2 py-1 text-sm"
        />
        <button
          onClick={applyDiscountCode}
          className="px-2 py-1 bg-green-600 text-white rounded text-sm"
        >
          {t('discount.apply')}
        </button>
        {appliedDiscount && (
          <span className="text-sm text-green-700">{appliedDiscount.nombreCodigo}</span>
        )}
      </div>

      <div className="md:flex md:items-start md:gap-6">
        <div className="my-6 border rounded shadow-md p-4 flex justify-center bg-gray-100 md:flex-1">
          <SeatingMap mapa={mapa} onClickSilla={toggleSillaEnCarrito} />
        </div>

        <div className="bg-white p-4 rounded shadow-md mt-6 md:mt-6 md:w-80">
          <h2 className="text-xl font-semibold mb-3">Carrito</h2>
          {selectedFunctionId && (
            <div className="mb-2 font-medium">
              {(() => {
                const fn = funciones.find(f => f._id === selectedFunctionId);
                return fn ? new Date(fn.fechaCelebracion).toLocaleString() : '';
              })()}
            </div>
          )}
        {carrito.map((item, index) => (
          <div key={index} className="flex justify-between items-center bg-gray-50 p-2 mb-2 rounded">
            <span>{item.zonaNombre} - {item.nombreMesa} - Silla {index + 1} - ${item.precio}
              {item.tipoPrecio === 'descuento' && ` (${item.descuentoNombre})`}
            </span>
            <button
              onClick={() => toggleSillaEnCarrito(item)}
              className="text-red-500 hover:text-red-700"
            >
              ❌
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const path = refParam ? `/store/pay?ref=${refParam}` : '/store/pay';
            navigate(path, { state: { carrito, funcionId: selectedFunctionId } });
          }}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Continuar al carrito
        </button>
        </div>
      </div>

      <Modal
        open={showSeatPopup}
        closable={false}
        maskClosable={true}
        onOk={() => setShowSeatPopup(false)}
        onCancel={() => setShowSeatPopup(false)}
        okText="Continuar"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <p>{evento?.otrasOpciones?.popupAntesAsiento?.texto}</p>
      </Modal>

      {widgets?.content?.length
        ? widgets.content.map((w, idx) => (
            <React.Fragment key={idx}>{renderWidget(w)}</React.Fragment>
          ))
        : null}
    </div>
  );
};

export default Event;
