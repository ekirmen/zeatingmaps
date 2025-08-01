import React, { useEffect, useState, useMemo, useCallback, useImperativeHandle, forwardRef, useRef } from 'react';
import { message } from 'antd';
import SeatingMap from './SeatingMap';
import { fetchMapa, fetchZonasPorSala, fetchAbonoAvailableSeats } from '../../../services/supabaseServices';
import { fetchSeatsByFuncion } from '../../services/supabaseSeats';
import { fetchDescuentoPorCodigo } from '../../../store/services/apistore';
import { useSeatLockStore } from '../../../components/seatLockStore'; 
import API_BASE_URL from '../../../utils/apiBase';
import resolveImageUrl from '../../../utils/resolveImageUrl';
import formatDateString from '../../../utils/formatDateString';
import CartWithTimer from '../../components/CartWithTimer';
import SeatAnimation from '../../components/SeatAnimation';

const ZonesAndPrices = ({
  eventos = [],
  selectedEvent,
  onEventSelect,
  funciones = [],
  onShowFunctions,
  selectedFuncion,
  carrito,
  setCarrito,
  selectedPlantilla,
  selectedClient,
  abonos = [],
  selectedAffiliate,
  setSelectedAffiliate,
  showSeatingMap = true,
}, ref) => {
const [mapa, setMapa] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [selectedZonaId, setSelectedZonaId] = useState(null);
  const [zoneQuantities, setZoneQuantities] = useState({});
  const [viewMode, setViewMode] = useState(showSeatingMap ? 'map' : 'zonas');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [blockMode, setBlockMode] = useState(false);
  const [tempBlocks, setTempBlocks] = useState([]);
  const [abonoMode, setAbonoMode] = useState(false);
  const [abonoSeats, setAbonoSeats] = useState([]);
  const [animatingSeats, setAnimatingSeats] = useState([]);
  const unlockSeatRef = useRef(useSeatLockStore.getState().unlockSeat);
  const mapContainerRef = useRef(null);
  
  // Extraer funciones del seat lock store
  const { lockSeat, unlockSeat, isSeatLocked, isSeatLockedByMe } = useSeatLockStore();

// Memoize detallesPlantilla to avoid recalculations
const detallesPlantillaMemo = React.useMemo(() => {
  if (!selectedPlantilla?.detalles) return [];
  if (Array.isArray(selectedPlantilla.detalles)) return selectedPlantilla.detalles;
  try {
    if (typeof selectedPlantilla.detalles === 'string') {
      const parsed = JSON.parse(selectedPlantilla.detalles);
      return Array.isArray(parsed) ? parsed : [];
    }
    return Array.isArray(selectedPlantilla.detalles)
      ? selectedPlantilla.detalles
      : Object.values(selectedPlantilla.detalles);
  } catch {
    return [];
  }
}, [selectedPlantilla]);

// Replace detallesPlantilla usage with memoized versions in the component


  const onSeatsUpdated = useCallback((ids, estado) => {
    setMapa((prev) => {
      if (!prev) return prev;
      const blocked = estado === 'bloqueado';
      return {
        ...prev,
        contenido: prev.contenido.map((mesa) => ({
          ...mesa,
          sillas: mesa.sillas.map((s) => {
            const sid = s._id || s.id;
            if (ids.includes(sid)) {
              return { ...s, estado: estado, bloqueado: blocked };
            }
            return s;
          }),
        })),
      };
    });
  }, []);

  useImperativeHandle(ref, () => ({ onSeatsUpdated }));

  function getPrecioConDescuento(detalle) {
    let price = detalle.precio || 0;
    if (appliedDiscount?.detalles) {
      const d = appliedDiscount.detalles.find((dt) => {
        const id = typeof dt.zona === 'object' ? dt.zona._id : dt.zona;
        return id === detalle.zonaId || id === detalle.zona?._id;
      });
      if (d) {
        if (d.tipo === 'porcentaje') {
          price = Math.max(0, price - (price * d.valor) / 100);
        } else {
          price = Math.max(0, price - d.valor);
        }
      }
    }
    return price;
  }

  const detallesPlantilla = useMemo(() => {
    if (!selectedPlantilla?.detalles) return [];
    if (Array.isArray(selectedPlantilla.detalles)) return selectedPlantilla.detalles;
    try {
      if (typeof selectedPlantilla.detalles === 'string') {
        const parsed = JSON.parse(selectedPlantilla.detalles);
        return Array.isArray(parsed) ? parsed : [];
      }
      return Array.isArray(selectedPlantilla.detalles)
        ? selectedPlantilla.detalles
        : Object.values(selectedPlantilla.detalles);
    } catch {
      return [];
    }
  }, [selectedPlantilla]);

  const zonePriceRanges = useMemo(() => {
    const ranges = {};
    detallesPlantilla.forEach((d) => {
      const nombre = d.zona?.nombre || d.zonaId || d.zona;
      const precio = getPrecioConDescuento(d);
      if (!ranges[nombre]) {
        ranges[nombre] = { nombre, min: precio, max: precio };
      } else {
        ranges[nombre].min = Math.min(ranges[nombre].min, precio);
        ranges[nombre].max = Math.max(ranges[nombre].max, precio);
      }
    });
    // Sort ranges by minimum price
    return Object.values(ranges).sort((a, b) => a.min - b.min);
  }, [detallesPlantilla, appliedDiscount]);

useEffect(() => {
    const loadData = async () => {
      let salaId = selectedFuncion?.sala;
      if (typeof salaId === 'object' && salaId !== null) {
        salaId = salaId._id || salaId.id || null;
      }
      const funcionId = selectedFuncion?.id || selectedFuncion?._id;
      if (salaId) {
        try {
          const [m, zs, seats] = await Promise.all([
            fetchMapa(salaId),
            fetchZonasPorSala(salaId),
            funcionId ? fetchSeatsByFuncion(funcionId) : Promise.resolve([]),
          ]);
          console.log('Loaded mapa:', m);

          const seatMap = seats.reduce((acc, s) => {
            acc[s.id || s._id] = { estado: s.estado, bloqueado: s.bloqueado };
            return acc;
          }, {});

          const mapped = {
            ...m,
            contenido: Array.isArray(m.contenido)
              ? m.contenido.map(el => ({
                  ...el,
                  sillas: el.sillas.map(s => {
                    const st = seatMap[s._id || s.id];
                    if (!st) return s;
                    const estado = st.bloqueado ? 'bloqueado' : st.estado || s.estado;
                    return { ...s, estado };
                  })
                }))
              : [],
          };
          

          setMapa(mapped);
          setZonas(Array.isArray(zs) ? zs : []);
        } catch (err) {
          console.error('Error loading map/zones:', err);
          message.error('Error cargando mapa');
          setMapa(null);
          setZonas([]);
        }
      } else {
        setMapa(null);
        setZonas([]);
      }
    };
    loadData();
  }, [selectedFuncion]);

  const handleSelectZoneForMap = (zonaId) => {
    setViewMode('map');
    setSelectedZonaId(zonaId);
    // Limpiar cantidades cuando se cambia a modo mapa
    setZoneQuantities({});
    setTimeout(() => {
      mapContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  // Nueva función para limpiar selección de zona
  const handleClearZoneSelection = () => {
    setSelectedZonaId(null);
    setZoneQuantities({});
  };

  // Mejorar la lógica de handleSeatClick para cortesías
  const handleSeatClick = (seat, table) => {
    const currentFuncId = selectedFuncion?.id || selectedFuncion?._id;
    const exists = carrito.find(
      (i) =>
        i._id === seat._id &&
        (abonoMode ? i.abonoGroup : i.funcionId === currentFuncId)
    );
    const zonaId = seat.zona;
    const zonaObj = zonas.find(z => (z.id || z._id) === zonaId);

    if (!selectedClient) {
      message.info('Seleccione un cliente antes de agregar asientos');
      return;
    }

    // Modo bloqueo - permite seleccionar asientos para bloquearlos
    if (blockMode) {
      // Verificar que el asiento no esté vendido, reservado o anulado
      if (seat.estado === 'pagado' || seat.estado === 'reservado' || seat.estado === 'anulado') {
        message.warning(`No se puede bloquear un asiento ${seat.estado}`);
        return;
      }

      // Verificar si ya está bloqueado por otro usuario
      if (isSeatLocked(seat._id) && !isSeatLockedByMe(seat._id)) {
        message.warning('Este asiento ya está siendo seleccionado por otro usuario');
        return;
      }

      const exists = carrito.find(i => i._id === seat._id && i.isBlocked);
      
      if (exists) {
        // Desbloquear asiento
        setCarrito(carrito.filter(i => !(i._id === seat._id && i.isBlocked)));
        unlockSeat(seat._id, currentFuncId).catch(console.error);
        message.success('Asiento desbloqueado');
      } else {
        // Bloquear asiento
        lockSeat(seat._id, currentFuncId).then(() => {
          setCarrito([
            ...carrito,
            {
              _id: seat._id,
              nombre: seat.nombre,
              nombreMesa: table.nombre,
              zona: zonaObj?.nombre || seat.zona,
              isBlocked: true,
              funcionId: currentFuncId,
              funcionFecha: selectedFuncion?.fechaCelebracion,
              precio: 0, // Los asientos bloqueados no tienen precio
            },
          ]);
          message.success('Asiento bloqueado correctamente');
        }).catch(err => {
          message.error('Error al bloquear el asiento');
          console.error('Error locking seat:', err);
        });
      }
      return;
    }

    // Verificar si el asiento está disponible para la zona seleccionada
    const seatZonaId = typeof seat.zona === "object" ? seat.zona._id || seat.zona.id : seat.zona;
    const isAvailable = selectedZonaId ? selectedZonaId === seatZonaId : true;
    
    if (!isAvailable && !blockMode) {
      message.warning('Este asiento no está disponible para la zona seleccionada');
      return;
    }

    // Determine pricing from the selected plantilla
    const detalle = detallesPlantilla.find(d => {
      const id = d.zonaId || (typeof d.zona === 'object' ? d.zona._id : d.zona);
      return id === zonaId;
    });
    
    if (!detalle) {
      message.error('Zona sin precio configurado');
      return;
    }

    const basePrice = detalle.precio || 0;
    let finalPrice = basePrice;
    let tipoPrecio = 'normal';
    let descuentoNombre = '';

    if (appliedDiscount?.detalles) {
      const d = appliedDiscount.detalles.find(dt => {
        const id = typeof dt.zona === 'object' ? dt.zona._id : dt.zona;
        return id === zonaId;
      });
      if (d) {
        if (d.tipo === 'porcentaje') {
          finalPrice = Math.max(0, basePrice - (basePrice * d.valor) / 100);
        } else {
          finalPrice = Math.max(0, basePrice - d.valor);
        }
        tipoPrecio = 'descuento';
        descuentoNombre = appliedDiscount.nombreCodigo;
      }
    }

    if (exists) {
      if (abonoMode) {
        const groupId = `abono-${seat._id}`;
        setCarrito(carrito.filter(i => i.abonoGroup !== groupId));
      } else {
        setCarrito(
          carrito.filter(
            (i) => !(i._id === seat._id && i.funcionId === currentFuncId)
          )
        );
      }
    } else {
      if (abonoMode) {
        const groupId = `abono-${seat._id}`;
        const items = funciones.map(f => ({
          _id: seat._id,
          nombre: seat.nombre,
          nombreMesa: table.nombre,
          zona: zonaObj?.nombre || seat.zona,
          precio: finalPrice,
          tipoPrecio,
          descuentoNombre,
          funcionId: f.id || f._id,
          funcionFecha: f.fechaCelebracion,
          abonoGroup: groupId,
        }));
        setCarrito([...carrito, ...items]);
             } else {
         const newSeat = {
           _id: seat._id,
           nombre: seat.nombre,
           nombreMesa: table.nombre,
           zona: zonaObj?.nombre || seat.zona,
           precio: finalPrice,
           tipoPrecio,
           descuentoNombre,
           funcionId: currentFuncId,
           funcionFecha: selectedFuncion?.fechaCelebracion,
         };
         
         setCarrito([...carrito, newSeat]);
         
         // Trigger animation
         handleSeatAnimation(newSeat);
       }
    }
  };

  useEffect(() => {
    if (!blockMode) {
      setTempBlocks([]);
      setCarrito(carrito.filter(i => !i.action));
    }
  }, [blockMode]);

  useEffect(() => {
    const loadAbonoSeats = async () => {
      if (abonoMode && selectedEvent?.id) {
        try {
          const ids = await fetchAbonoAvailableSeats(selectedEvent.id);
          setAbonoSeats(Array.isArray(ids) ? ids : []);
        } catch (err) {
          console.error('Error loading abono seats', err);
          message.error('Error cargando asientos de abono');
          setAbonoSeats([]);
        }
      } else {
        setAbonoSeats([]);
      }
    };
    loadAbonoSeats();
  }, [abonoMode, selectedEvent]);

  // Liberar asientos bloqueados temporalmente al desmontar o recargar la página
  useEffect(() => {
    const cleanupTemp = () => {
      tempBlocks.forEach(id => {
        unlockSeatRef.current(id).catch(() => {});
      });
    };
    window.addEventListener('beforeunload', cleanupTemp);
    return () => {
      cleanupTemp();
      window.removeEventListener('beforeunload', cleanupTemp);
    };
  }, [tempBlocks]);
  

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    try {
      const data = await fetchDescuentoPorCodigo(encodeURIComponent(discountCode.trim()));
      const now = Date.now();
      if (data.fechaInicio && new Date(data.fechaInicio).getTime() > now) {
        throw new Error('Descuento no disponible aún');
      }
      if (data.fechaFinal && new Date(data.fechaFinal).getTime() < now) {
        throw new Error('Descuento expirado');
      }
      setAppliedDiscount(data);
      message.success('Descuento aplicado');
    } catch (err) {
      setAppliedDiscount(null);
      message.error(err.message || 'Código inválido');
    }
  };


  const handleQuantityChange = (zonaId, value) => {
    setZoneQuantities(prev => ({ ...prev, [zonaId]: value }));
  };

  const handleAddZoneToCart = (detalle) => {
    const zonaId = detalle.zonaId || (typeof detalle.zona === 'object' ? detalle.zona._id : detalle.zona);
    const qty = parseInt(zoneQuantities[zonaId], 10);
    if (!qty || qty <= 0) return;

    if (!selectedClient) {
      message.info('Seleccione un cliente antes de agregar asientos');
    }

    const zonaNombre = detalle.zona?.nombre || detalle.zonaId || detalle.zona;
    const precio = getPrecioConDescuento(detalle);
    let tipoPrecio = 'normal';
    let descuentoNombre = '';

    if (appliedDiscount?.detalles) {
      const d = appliedDiscount.detalles.find(dt => {
        const id = typeof dt.zona === 'object' ? dt.zona._id : dt.zona;
        return id === zonaId;
      });
      if (d) {
        tipoPrecio = 'descuento';
        descuentoNombre = appliedDiscount.nombreCodigo;
      }
    }

    const funcId = selectedFuncion?.id || selectedFuncion?._id;
    const funcFecha = selectedFuncion?.fechaCelebracion;
    const items = Array.from({ length: qty }).map((_, idx) => ({
      _id: `${zonaId}-${Date.now()}-${idx}`,
      nombre: '',
      nombreMesa: '',
      zona: zonaNombre,
      precio,
      tipoPrecio,
      descuentoNombre,
      funcionId: funcId,
      funcionFecha: funcFecha,
    }));
    setCarrito([...carrito, ...items]);
    setZoneQuantities(prev => ({ ...prev, [zonaId]: '' }));
  };

  const handleAddSingleZoneTicket = (zona) => {
    const zonaId = zona.id || zona._id;
    const zonaNombre = zona.nombre;
    const detalle = detallesPlantilla.find(d => {
      const id = d.zonaId || (typeof d.zona === 'object' ? d.zona._id : d.zona);
      return id === zonaId;
    });
    if (!detalle) {
      message.error('Zona sin precio configurado');
      return;
    }

    if (!selectedClient) {
      message.info('Seleccione un cliente antes de agregar asientos');
    }

    const precio = getPrecioConDescuento(detalle);
    let tipoPrecio = 'normal';
    let descuentoNombre = '';

    if (appliedDiscount?.detalles) {
      const d = appliedDiscount.detalles.find(dt => {
        const id = typeof dt.zona === 'object' ? dt.zona._id : dt.zona;
        return id === zonaId;
      });
      if (d) {
        tipoPrecio = 'descuento';
        descuentoNombre = appliedDiscount.nombreCodigo;
      }
    }

    const funcId = selectedFuncion?.id || selectedFuncion?._id;
    const funcFecha = selectedFuncion?.fechaCelebracion;
    const item = {
      _id: `${zonaId}-${Date.now()}`,
      nombre: '',
      nombreMesa: '',
      zona: zonaNombre,
      precio,
      tipoPrecio,
      descuentoNombre,
      funcionId: funcId,
      funcionFecha: funcFecha,
    };
    setCarrito([...carrito, item]);
  };

  // Función para manejar animación de asiento
  const handleSeatAnimation = (seat) => {
    setAnimatingSeats(prev => [...prev, seat]);
  };

  // Función para completar animación
  const handleAnimationComplete = (seatId) => {
    setAnimatingSeats(prev => prev.filter(seat => seat._id !== seatId));
  };

  // Nueva función para seleccionar mesa completa
  const handleSelectCompleteTable = (table) => {
    if (!selectedClient) {
      message.info('Seleccione un cliente antes de agregar asientos');
      return;
    }

    const currentFuncId = selectedFuncion?.id || selectedFuncion?._id;
    const availableZonas = zonas.map(z => z.id || z._id);
    const availableSeats = table.sillas.filter(silla => {
      const seatZonaId = typeof silla.zona === "object" ? silla.zona._id || silla.zona.id : silla.zona;
      const isAvailable = availableZonas?.includes(seatZonaId) || !availableZonas;
      const isAbono = abonoMode && abonoSeats.includes(silla._id);
      const abonoRestriction = abonoMode && abonoSeats.length > 0 ? isAbono : true;
      return silla.estado === 'disponible' && isAvailable && abonoRestriction;
    });

    if (availableSeats.length === 0) {
      message.warning('No hay asientos disponibles en esta mesa');
      return;
    }

    const seatsToAdd = [];
    availableSeats.forEach(seat => {
      const zonaId = seat.zona;
      const zonaObj = zonas.find(z => (z.id || z._id) === zonaId);
      
      // Determine pricing from the selected plantilla
      const detalle = detallesPlantilla.find(d => {
        const id = d.zonaId || (typeof d.zona === 'object' ? d.zona._id : d.zona);
        return id === zonaId;
      });
      
      if (!detalle) {
        message.error(`Zona ${zonaObj?.nombre || zonaId} sin precio configurado`);
        return;
      }

      const basePrice = detalle.precio || 0;
      let finalPrice = basePrice;
      let tipoPrecio = 'normal';
      let descuentoNombre = '';

      if (appliedDiscount?.detalles) {
        const d = appliedDiscount.detalles.find(dt => {
          const id = typeof dt.zona === 'object' ? dt.zona._id : dt.zona;
          return id === zonaId;
        });
        if (d) {
          if (d.tipo === 'porcentaje') {
            finalPrice = Math.max(0, basePrice - (basePrice * d.valor) / 100);
          } else {
            finalPrice = Math.max(0, basePrice - d.valor);
          }
          tipoPrecio = 'descuento';
          descuentoNombre = appliedDiscount.nombreCodigo;
        }
      }

      seatsToAdd.push({
        _id: seat._id,
        nombre: seat.nombre,
        nombreMesa: table.nombre,
        zona: zonaObj?.nombre || seat.zona,
        precio: finalPrice,
        tipoPrecio,
        descuentoNombre,
        funcionId: currentFuncId,
        funcionFecha: selectedFuncion?.fechaCelebracion,
      });
    });

    setCarrito([...carrito, ...seatsToAdd]);
    message.success(`${seatsToAdd.length} asientos de la mesa "${table.nombre}" agregados al carrito`);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            className="border p-2 rounded text-sm pr-8"
            value={selectedEvent?.id || selectedEvent?._id || ''}
            onChange={(e) => onEventSelect(e.target.value)}
          >
            <option value="" disabled>
              Seleccionar evento
            </option>
            {eventos.map((ev) => (
              <option key={ev.id || ev._id} value={ev.id || ev._id}>
                {ev.nombre}
              </option>
            ))}
          </select>
          {selectedEvent?.imagenes?.logoCuadrado && (
            <img
              src={resolveImageUrl(selectedEvent.imagenes.logoCuadrado)}
              alt="Evento"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 object-cover rounded"
            />
          )}
        </div>
        {funciones.length >= 2 && !selectedFuncion && (
          <button
            onClick={onShowFunctions}
            className="px-2 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Mostrar Funciones
          </button>
        )}
      </div>

      {selectedFuncion && (
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {formatDateString(selectedFuncion.fechaCelebracion)}
          </span>
          {typeof onShowFunctions === 'function' && (
            <button
              type="button"
              onClick={() => onShowFunctions()}
              className="text-blue-600 underline text-sm"
            >
              Cambiar función
            </button>
          )}
        </div>
      )}

      {showSeatingMap && (
        <div className="bg-gray-100 p-3 rounded-lg">
          <div className="text-sm font-medium mb-2">Tipo de vista:</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'map' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              🗺️ Mapa
            </button>
            <button
              type="button"
              onClick={() => setViewMode('zonas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'zonas' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              📋 Zonas
            </button>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            {viewMode === 'map' 
              ? 'Selecciona asientos individuales o usa "Mesa completa" para seleccionar toda la mesa'
              : 'Selecciona zonas y cantidades para agregar al carrito'
            }
          </div>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <input
          type="text"
          className="border p-1 rounded flex-1"
          placeholder="Código de descuento"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
        />
        <button
          type="button"
          onClick={handleApplyDiscount}
          className="px-3 py-1 bg-green-600 text-white rounded"
        >
          Aplicar
        </button>
        {appliedDiscount && (
          <span className="text-green-700 text-sm">{appliedDiscount.nombreCodigo}</span>
        )}
      </div>

      <div className="flex gap-2 items-center mb-4">
        <label className="text-sm flex items-center gap-1">
          <input
            type="checkbox"
            checked={blockMode}
            onChange={e => {
              setBlockMode(e.target.checked);
              if (e.target.checked) {
                message.info('Modo bloqueo activado: Selecciona asientos para bloquearlos');
              } else {
                // Limpiar asientos bloqueados del carrito al desactivar
                setCarrito(prev => prev.filter(item => !item.isBlocked));
                message.info('Modo bloqueo desactivado');
              }
            }}
          />
          🔒 Bloquear asientos
        </label>
        <label className="ml-4 text-sm flex items-center gap-1">
          <input
            type="checkbox"
            checked={abonoMode}
            onChange={e => setAbonoMode(e.target.checked)}
          />
          Modo abono
        </label>
      </div>

      {showSeatingMap && viewMode === 'map' ? (
        mapa ? (
          <>
            {zonas.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Zonas disponibles:</h3>
                  {selectedZonaId && (
                    <button
                      type="button"
                      onClick={handleClearZoneSelection}
                      className="text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Limpiar selección
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {zonas.map(z => {
                    const id = z.id || z._id;
                    const isSelected = selectedZonaId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedZonaId(isSelected ? null : id)}
                        className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                          isSelected 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {z.nombre}
                      </button>
                    );
                  })}
                </div>
                {selectedZonaId && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      ✅ Zona seleccionada: <strong>{zonas.find(z => (z.id || z._id) === selectedZonaId)?.nombre}</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Solo los asientos de esta zona estarán disponibles para selección
                    </p>
                  </div>
                )}
              </div>
            )}
            {zonePriceRanges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {zonePriceRanges.map(zr => (
                  <div key={zr.nombre} className="text-xs bg-gray-100 rounded px-2 py-1">
                    <strong>{zr.nombre}</strong>{' '}
                    {zr.min === zr.max ? `$${zr.min.toFixed(2)}` : `$${zr.min.toFixed(2)} - $${zr.max.toFixed(2)}`}
                  </div>
                ))}
              </div>
            )}
            <SeatingMap
              mapa={mapa}
              onSeatClick={handleSeatClick}
              selectedZona={zonas.find(z => (z.id || z._id) === selectedZonaId) || null}
              availableZonas={selectedZonaId ? [selectedZonaId] : zonas.map(z => z.id || z._id)}
              blockMode={blockMode}
              tempBlocks={tempBlocks}
              abonoMode={abonoMode}
              abonoSeats={abonoSeats}
              containerRef={mapContainerRef}
              onSelectCompleteTable={handleSelectCompleteTable}
            />
          </>
        ) : (
          <p className="text-center text-gray-500">No hay mapa disponible</p>
        )
      ) : (
        <div className="overflow-x-auto">
          {detallesPlantilla.length ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Zonas y Precios</h3>
                <p className="text-sm text-gray-600">Selecciona la cantidad de asientos por zona</p>
              </div>
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Zona</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">Precio</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Cantidad</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {detallesPlantilla.map((d) => {
                    const zonaId = d.zonaId || (typeof d.zona === 'object' ? d.zona._id : d.zona);
                    const zonaNombre = d.zona?.nombre || d.zonaId || d.zona;
                    const precio = getPrecioConDescuento(d);
                    return (
                      <tr key={zonaId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{zonaNombre}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">${precio.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            className="border border-gray-300 rounded px-3 py-2 w-20 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={zoneQuantities[zonaId] || ''}
                            onChange={(e) => handleQuantityChange(zonaId, e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-3 text-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleAddZoneToCart(d)}
                            disabled={!zoneQuantities[zonaId] || zoneQuantities[zonaId] <= 0}
                            className="px-3 py-1 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            Añadir
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectZoneForMap(zonaId)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Seleccionar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <p className="text-gray-500 text-lg">No hay plantilla de precios configurada</p>
              <p className="text-gray-400 text-sm">Configura los precios por zona para continuar</p>
            </div>
          )}

          {abonos.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Abonos disponibles</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {abonos.map((a) => (
                  <li key={a.id || a._id}>{a.packageType || a.tipo}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
     
     {/* Carrito con temporizador */}
     <CartWithTimer
       carrito={carrito}
       setCarrito={setCarrito}
       onPaymentClick={() => {
         // Aquí puedes agregar la lógica para ir a la página de pagos
         message.info('Redirigiendo a pagos...');
       }}
       selectedClient={selectedClient}
       selectedAffiliate={selectedAffiliate}
     />
     
     {/* Animaciones de asientos */}
     {animatingSeats.map((seat) => (
       <SeatAnimation
         key={`${seat._id}-${Date.now()}`}
         seat={seat}
         onAnimationComplete={handleAnimationComplete}
       />
     ))}
   </div>
 );
};

export default forwardRef(ZonesAndPrices);
