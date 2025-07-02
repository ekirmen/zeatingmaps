import { useEffect, useState, useRef } from 'react';
import { useCart } from '../../contexts/CartContext';
import { fetchMapa, fetchPlantillaPrecios, getFunciones } from '../services/apistore';
import { fetchZonasPorSala } from '../../services/supabaseServices';
import { fetchSeatsByFuncion, updateSeat, createOrUpdateSeat } from '../../backoffice/services/supabaseSeats';
import { lockSeat, unlockSeat } from '../../backoffice/services/seatLocks';
import { supabase } from '../../backoffice/services/supabaseClient';
import { fetchPayments } from '../../backoffice/services/apibackoffice';
import { loadGtm, loadMetaPixel } from '../utils/analytics';
import { isUuid } from '../../utils/isUuid';
import API_BASE_URL from '../../utils/apiBase';
import useSeatRealtime from './useSeatRealtime';

const API_URL = API_BASE_URL;

const useEventData = (eventId, seatMapRef) => {
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
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const { cart: globalCart, functionId: globalFunctionId, setCart: setGlobalCart } = useCart();
  const [recintoInfo, setRecintoInfo] = useState(null);
  const [tagNames, setTagNames] = useState([]);

  useEffect(() => {
    if (globalCart.length) {
      setCarrito(globalCart);
    }
    if (globalFunctionId) {
      setSelectedFunctionId(globalFunctionId);
    }
  }, []); // run once on mount

  useEffect(() => {
    setGlobalCart(carrito, selectedFunctionId);
  }, [carrito, selectedFunctionId, setGlobalCart]);

  const getZonaColor = (zonaId) => {
    const zonaObj = zonas.find(z => (z.id || z._id) === zonaId);
    return zonaObj?.color;
  };

  useSeatRealtime(selectedFunctionId, zonas, setMapa, cartRef);

  useEffect(() => {
    cartRef.current = carrito;
  }, [carrito]);

  const releaseSeats = async (seats) => {
    try {
      await Promise.all(
        seats.map((s) => {
          const updates = { status: 'disponible' };
          const updatePromise = updateSeat(s._id, updates).catch((err) => {
            if (err.message === 'Seat not found') {
              return createOrUpdateSeat(s._id, selectedFunctionId, s.zona, updates);
            }
            throw err;
          });
          const ops = [updatePromise];
          if (isUuid(s._id)) ops.push(unlockSeat(s._id));
          return Promise.all(ops);
        })
      );
    } catch (err) {
      console.error('Error releasing seats', err);
    }
  };

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
    } catch (err) {
      setAppliedDiscount(null);
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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
    if (eventId) fetchEvento();
  }, [eventId]);

  useEffect(() => {
    const loadTagNames = async () => {
      if (!Array.isArray(evento?.tags) || evento.tags.length === 0) {
        setTagNames([]);
        return;
      }

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

        const zonasMap = new Map();

        for (const funcion of funciones) {
          const detalles = funcion?.plantilla?.detalles || [];
          detalles.forEach((detalle) => {
            if (detalle.zonaId && !zonasMap.has(detalle.zonaId)) {
              zonasMap.set(detalle.zonaId, { id: detalle.zonaId, nombre: detalle.nombre || detalle.zonaNombre || '', color: detalle.color });
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
                  zonasMap.set(key, { id: key, nombre: z.nombre, color: z.color });
                }
              });
            } catch (e) {
              console.error('Error fetching zonas por sala', e);
            }
          }
        }

        const zonasUnicas = Array.from(zonasMap.values());
        setZonas(zonasUnicas);

      } catch (error) {
        console.error('Error fetching zonas desde funciones:', error);
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
          const estado = s.bloqueado ? 'bloqueado' : s.status;
          acc[s._id || s.id] = estado;
          return acc;
        }, {});

        if (mapaData && Array.isArray(mapaData.contenido)) {
          const selectedIds = carrito.map(c => c._id);
          const mapaActualizado = {
            ...mapaData,
            contenido: mapaData.contenido.map(elemento => ({
              ...elemento,
              sillas: elemento.sillas.map(silla => {
                const estado = seatMap[silla._id];
                const zonaId = silla.zona || elemento.zona;
                const baseColor = getZonaColor(zonaId) || 'lightblue';
                const isSelected = selectedIds.includes(silla._id);
                let finalColor = baseColor;
                if (estado === 'bloqueado') finalColor = isSelected ? baseColor : 'orange';
                else if (estado === 'reservado') finalColor = 'red';
                else if (estado === 'pagado') finalColor = 'gray';
                return {
                  ...silla,
                  estado: estado || silla.estado,
                  color: finalColor,
                  selected: isSelected
                };
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

  useEffect(() => {
    if (selectedFunctionId && seatMapRef?.current) {
      seatMapRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedFunctionId, seatMapRef]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  const toggleSillaEnCarrito = async (silla, mesa) => {
    const zonaId = silla.zona || mesa.zona;
    if (
      !zonaId ||
      ['reservado', 'pagado', 'bloqueado'].includes(silla.estado) ||
      silla.bloqueado
    ) {
      return;
    }

    const index = carrito.findIndex(item => item._id === silla._id);
    if (index === -1 && evento?.maxTicketsCompra && carrito.length >= evento.maxTicketsCompra) {
      return;
    }

    const basePrice = plantillaPrecios?.detalles.find(p => p.zonaId === zonaId)?.precio || 100;
    const zonaNombre = zonas.find(z => (z.id || z._id || z.zonaId) === zonaId)?.nombre || 'Desconocida';
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
      if (index !== -1) {
        await Promise.all([
          createOrUpdateSeat(silla._id, selectedFunctionId, zonaId, { status: 'disponible' }),
          isUuid(silla._id) ? unlockSeat(silla._id) : Promise.resolve()
        ]);
      } else {
        await Promise.all([
          createOrUpdateSeat(silla._id, selectedFunctionId, zonaId, { status: 'bloqueado' }),
          isUuid(silla._id) ? lockSeat(silla._id, 'bloqueado') : Promise.resolve()
        ]);
      }
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
        sillas: elemento.sillas.map(s => {
          const zonaIdSilla = s.zona || elemento.zona;
          const baseColor = getZonaColor(zonaIdSilla) || 'lightblue';
          const isSelected = nuevoCarrito.some(item => item._id === s._id);
          let finalColor = baseColor;
          let newEstado = s.estado;
          if (s.estado === 'bloqueado') finalColor = 'orange';
          else if (s.estado === 'reservado') finalColor = 'red';
          else if (s.estado === 'pagado') finalColor = 'gray';
          else {
            newEstado = isSelected ? 'bloqueado' : 'disponible';
          }
          return {
            ...s,
            zona: zonaIdSilla,
            color: finalColor,
            selected: isSelected,
            estado: newEstado
          };
        })
      }))
    };

    setMapa(updatedMapa);
  };

  // Mantener la selección visual al restaurar el carrito
  useEffect(() => {
    if (!mapa) return;
    if (!carrito.length) return;

    setMapa(prevMapa => {
      const selectedIds = carrito.map(c => c._id);
      const contenido = prevMapa.contenido.map(elemento => ({
        ...elemento,
        sillas: elemento.sillas.map(s => {
          const zonaIdSilla = s.zona || elemento.zona;
          const baseColor = getZonaColor(zonaIdSilla) || 'lightblue';
          const isSelected = selectedIds.includes(s._id);
          let finalColor = baseColor;
          if (s.estado === 'bloqueado') finalColor = isSelected ? baseColor : 'orange';
          else if (s.estado === 'reservado') finalColor = 'red';
          else if (s.estado === 'pagado') finalColor = 'gray';
          if (s.selected === isSelected && s.color === finalColor) return s;
          return { ...s, selected: isSelected, color: finalColor };
        })
      }));
      return { ...prevMapa, contenido };
    });
  }, [carrito]);

  return {
    evento,
    funciones,
    selectedFunctionId,
    setSelectedFunctionId,
    mapa,
    plantillaPrecios,
    carrito,
    zonas,
    pagos,
    showSeatPopup,
    setShowSeatPopup,
    discountCode,
    setDiscountCode,
    appliedDiscount,
    timeLeft,
    tagNames,
    recintoInfo,
    toggleSillaEnCarrito,
    applyDiscountCode
  };
};

export default useEventData;
