// src/pages/Event.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { Modal, message } from 'antd';
import SeatingMap from '../components/SeatingMap'; // al inicio
import { fetchMapa, fetchPlantillaPrecios, getCmsPage, getFunciones } from '../services/apistore';
import { fetchSeatsByFuncion, updateSeat } from '../../backoffice/services/supabaseSeats';
import EventListWidget from '../components/EventListWidget';
import FaqWidget from '../components/FaqWidget';
import API_BASE_URL from '../../utils/apiBase';
import resolveImageUrl from '../../utils/resolveImageUrl';
import { fetchPayments } from '../../backoffice/services/apibackoffice';
import { useTranslation } from 'react-i18next';
import { loadGtm, loadMetaPixel } from '../utils/analytics';
import { QRCodeSVG } from '@rc-component/qrcode';
import { supabase } from '../../backoffice/services/supabaseClient'; // asegúrate de tener este cliente
import { isUuid } from '../../utils/isUuid';
import formatDateString from '../../utils/formatDateString';

const API_URL = API_BASE_URL;
const EventMap = () => {
  const { eventId } = useParams(); // eventId puede ser slug o id real
  const navigate = useNavigate();
  const location = useLocation();
  const { refParam } = useRefParam();
  const { t } = useTranslation();

  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [plantillaPrecios, setPlantillaPrecios] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const cartRef = useRef([]);
  const [zonas, setZonas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [showSeatPopup, setShowSeatPopup] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [widgets, setWidgets] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const [recintoInfo, setRecintoInfo] = useState(null);
  const [tagNames, setTagNames] = useState([]);

  useEffect(() => {
    cartRef.current = carrito;
  }, [carrito]);

  // Allow selecting a function via query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const funcId = params.get('funcion');
    if (funcId) {
      setSelectedFunctionId(funcId);
    }
  }, [location.search]);

  const releaseSeats = async (seats) => {
    try {
      await Promise.all(
        seats.map((s) => updateSeat(s._id, { status: 'disponible' }))
      );
    } catch (err) {
      console.error('Error releasing seats', err);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

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
    const column = isUuid(eventId) ? 'id' : 'slug';
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq(column, eventId)
      .maybeSingle();

    if (error) throw error;
    setEvento(data);

    // Opcional: carga datos del recinto si necesitas
    if (data?.recinto) {
      const { data: recintoData, error: recintoError } = await supabase
        .from('recintos')
        .select('*')
        .eq('id', data.recinto)
        .single();
      if (!recintoError) setRecintoInfo(recintoData);
    }

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
    const loadTagNames = async () => {
      if (!Array.isArray(evento?.tags) || evento.tags.length === 0) {
        setTagNames([]);
        return;
      }

      // If tags are object IDs, fetch their names
      if (typeof evento.tags[0] === 'string' && evento.tags[0].length === 24) {
        try {
          const res = await fetch(`${API_URL}/api/tags`);
          const allTags = await res.json();
          const names = evento.tags.map(id => {
            const found = allTags.find(t => t._id === id);
            return found ? found.name : id;
          });
          setTagNames(names);
        } catch (err) {
          console.error('Error fetching tags', err);
          setTagNames(evento.tags);
        }
      } else {
        setTagNames(evento.tags.map(t => (typeof t === 'string' ? t : t.name)));
      }
    };
    loadTagNames();
  }, [evento]);

  useEffect(() => {
    const fetchFunciones = async () => {
      try {
        const id = evento?.id || (isUuid(eventId) ? eventId : null);
        if (!id) return;
        const data = await getFunciones(id);
        setFunciones(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length === 1) {
          setSelectedFunctionId(data[0].id || data[0]._id);
        }
      } catch (error) {
        console.error('Error fetching functions:', error);
      }
    };
    if (evento?.id || isUuid(eventId)) fetchFunciones();
  }, [eventId, evento]);

  useEffect(() => {
    const fetchAllZonas = async () => {
      try {
        const id = evento?.id || (isUuid(eventId) ? eventId : null);
        if (!id) return;
        const funciones = await getFunciones(id);

        if (!Array.isArray(funciones)) {
          setZonas([]);
          return;
        }
  
        // Extraer zonas desde plantillas y desde cada sala asociada
        const zonasMap = new Map();

        for (const funcion of funciones) {
          const detalles = funcion?.plantilla?.detalles || [];
          detalles.forEach((detalle) => {
            if (detalle.zonaId && !zonasMap.has(detalle.zonaId)) {
              zonasMap.set(detalle.zonaId, { id: detalle.zonaId, nombre: detalle.nombre || detalle.zonaNombre || '' });
            }
          });

          const salaId =
            typeof funcion.sala === 'object'
              ? funcion.sala._id || funcion.sala.id
              : funcion.sala;
          if (salaId) {
            try {
              const zonasSala = await fetchZonasPorSala(salaId);
              zonasSala.forEach((z) => {
                const key = z.id || z._id;
                if (key && !zonasMap.has(key)) {
                  zonasMap.set(key, { id: key, nombre: z.nombre });
                }
              });
            } catch (e) {
              console.error('Error fetching zonas por sala', e);
            }
          }
        }

        const zonasUnicas = Array.from(zonasMap.values());
        setZonas(zonasUnicas); // Esto depende de cómo quieras estructurarlas visualmente
  
      } catch (error) {
        console.error("Error fetching zonas desde funciones:", error);
        message.error("Error al cargar zonas: " + error.message);
      }
    };
  
    if (evento?.id || isUuid(eventId)) fetchAllZonas();
  }, [eventId, evento]);
  
  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const data = await fetchPayments();
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
      const funcion = funciones.find(f => (f.id || f._id) === selectedFunctionId);
      if (!funcion) return;

      try {
        const salaId =
          typeof funcion.sala === 'object'
            ? funcion.sala._id || funcion.sala.id
            : funcion.sala;
        const [mapaData, seatStates] = await Promise.all([
          fetchMapa(salaId),
          fetchSeatsByFuncion(selectedFunctionId)
        ]);

        const seatMap = seatStates.reduce((acc, s) => {
          // Prioritize the `bloqueado` flag when determining the seat status so
          // seats blocked via the backoffice show up correctly in the map.
          const estado = s.bloqueado ? 'bloqueado' : s.status;
          acc[s._id || s.id] = estado;
          return acc;
        }, {});

        if (mapaData && Array.isArray(mapaData.contenido)) {
          const mapaActualizado = {
            ...mapaData,
            contenido: mapaData.contenido.map(elemento => ({
              ...elemento,
              sillas: elemento.sillas.map(silla => {
                const estado = seatMap[silla._id];
                if (estado) {
                  return {
                    ...silla,
                    estado,
                    color:
                      estado === 'bloqueado' ? 'orange' :
                      estado === 'reservado' ? 'red' :
                      estado === 'pagado' ? 'gray' : silla.color || 'lightblue'
                  };
                }
                return silla;
              })
            }))
          };

          setMapa(mapaActualizado);
        } else {
          setMapa(null);
        }

        if (funcion.plantilla?.id || funcion.plantilla?._id) {
          const plantillaData = await fetchPlantillaPrecios(funcion.plantilla._id);
          setPlantillaPrecios(plantillaData);
        }
      } catch (error) {
        console.error('Error loading selected data:', error);
      }
    };
    cargarDatosSeleccionados();
  }, [selectedFunctionId, funciones]);

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/descuentos/code/${encodeURIComponent(discountCode.trim())}`);
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
          releaseSeats(cartRef.current);
          setCarrito([]);
          message.info('Tiempo expirado, asientos liberados');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (cartRef.current.length) {
        releaseSeats(cartRef.current);
      }
    };
  }, []);

  const toggleSillaEnCarrito = async (silla, mesa) => {
    const zonaId = silla.zona || mesa.zona;
    if (
      !zonaId ||
      ["reservado", "pagado", "bloqueado"].includes(silla.estado) ||
      silla.bloqueado
    ) {
      message.error("Este asiento no está disponible.");
      return;
    }

    const index = carrito.findIndex(item => item._id === silla._id);
    if (index === -1 && evento?.maxTicketsCompra && carrito.length >= evento.maxTicketsCompra) {
      message.error(`Solo puedes seleccionar ${evento.maxTicketsCompra} asientos.`);
      return;
    }

    const basePrice = plantillaPrecios?.detalles.find(p => p.zonaId === zonaId)?.precio || 100;
    const zonaNombre = zonas.find(z => (z.id || z._id || z.zonaId) === zonaId)?.nombre || "Desconocida";
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
      : [...carrito, { ...silla, zona: zonaId, precio: finalPrice, nombreMesa: mesa.nombre, zonaNombre, tipoPrecio, descuentoNombre }];

    try {
      await updateSeat(silla._id, { status: index !== -1 ? 'disponible' : 'bloqueado' });
    } catch (err) {
      console.error('Error updating seat', err);
    }

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
          zona: s.zona || elemento.zona,
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

      {(evento?.imagenes?.portada || evento?.imagenes?.banner) && (
        <div className="relative mb-4">
          <img
            src={resolveImageUrl(
              evento?.imagenes?.portada || evento?.imagenes?.banner
            )}
            alt={`Imagen de ${evento.nombre}`}
            className="w-full max-h-[80vh] object-cover rounded"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4 text-white rounded">
            {tagNames.length > 0 && (
              <span className="text-sm mb-1">
                {tagNames.join(', ')}
              </span>
            )}
            <h1 className="text-3xl font-bold">{evento?.nombre}</h1>
            {recintoInfo?.nombre ? (
              <p className="text-sm">{recintoInfo.nombre}</p>
            ) : (
              typeof evento?.recinto === 'string' && (
                <p className="text-sm">{evento.recinto}</p>
              )
            )}
          </div>
        </div>
      )}

      {evento?.descripcionHTML && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Diseño del espectáculo</h3>
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: evento.descripcionHTML }}
          />
          {evento.resumenDescripcion && (
            <p className="mt-2">{evento.resumenDescripcion}</p>
          )}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Funciones</h3>
        <div className="flex flex-col gap-2">
          {funciones.map(funcion => (
            <label key={funcion.id || funcion._id} className="flex items-center gap-2">
              <input
                type="radio"
                name="funcion"
                value={funcion.id || funcion._id}
                onChange={() => setSelectedFunctionId(funcion.id || funcion._id)}
              />
              <span>{funcion.evento?.nombre} - {formatDateString(funcion.fechaCelebracion)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-2 flex gap-2 items-center">
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
          <SeatingMap mapa={mapa} zonas={zonas} onClickSilla={toggleSillaEnCarrito} />
        </div>

        <div className="bg-white p-4 rounded shadow-md mt-6 md:mt-6 md:w-80">
          <h2 className="text-xl font-semibold mb-3">Carrito</h2>
          {selectedFunctionId && (
            <div className="mb-2 font-medium">
              {(() => {
                const fn = funciones.find(f => (f.id || f._id) === selectedFunctionId);
                return fn ? formatDateString(fn.fechaCelebracion) : '';
              })()}
            </div>
          )}
        {carrito.map((item, index) => (
          <div key={index} className="flex justify-between items-center bg-gray-50 p-2 mb-2 rounded">
            <span>{item.zonaNombre} - {item.nombreMesa} - Silla {item.nombre || index + 1} - ${item.precio}
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
    </div>
  );
};

export default EventMap;
