import React, { useEffect, useState, useMemo } from 'react';
import { message } from 'antd';
import SeatingMap from './SeatingMap';
import { fetchMapa, fetchZonasPorSala } from '../../../services/supabaseServices';
import { fetchSeatsByFuncion } from '../../services/supabaseSeats';
import { fetchDescuentoPorCodigo } from '../../../store/services/apistore';

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
}) => {
const [mapa, setMapa] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [selectedZonaId, setSelectedZonaId] = useState(null);
  const [zoneQuantities, setZoneQuantities] = useState({});
  const [viewMode, setViewMode] = useState('map');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [blockMode, setBlockMode] = useState(false);
  const [tempBlocks, setTempBlocks] = useState([]);

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
      const zonaId = d.zonaId || (typeof d.zona === 'object' ? d.zona._id : d.zona);
      const nombre = d.zona?.nombre || d.zonaId || d.zona;
      const precio = getPrecioConDescuento(d);
      if (!ranges[zonaId]) {
        ranges[zonaId] = { nombre, min: precio, max: precio };
      } else {
        ranges[zonaId].min = Math.min(ranges[zonaId].min, precio);
        ranges[zonaId].max = Math.max(ranges[zonaId].max, precio);
      }
    });
    return ranges;
  }, [detallesPlantilla, appliedDiscount]);

  useEffect(() => {
    const loadData = async () => {
      const salaId = selectedFuncion?.sala?._id || selectedFuncion?.sala;
      const funcionId = selectedFuncion?.id || selectedFuncion?._id;
      if (salaId) {
        try {
          const [m, zs, seats] = await Promise.all([
            fetchMapa(salaId),
            fetchZonasPorSala(salaId),
            funcionId ? fetchSeatsByFuncion(funcionId) : Promise.resolve([]),
          ]);

          const seatMap = seats.reduce((acc, s) => {
            acc[s.id || s._id] = { estado: s.estado, bloqueado: s.bloqueado };
            return acc;
          }, {});

          const mapped = {
            ...m,
            contenido: m.contenido.map(el => ({
              ...el,
              sillas: el.sillas.map(s => {
                const st = seatMap[s._id || s.id];
                if (!st) return s;
                const estado = st.bloqueado ? 'bloqueado' : st.estado || s.estado;
                return { ...s, estado };
              })
            }))
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

  const handleSeatClick = (seat, table) => {
    const currentFuncId = selectedFuncion?.id || selectedFuncion?._id;
    const exists = carrito.find(
      (i) => i._id === seat._id && i.funcionId === currentFuncId
    );
    const zonaId = seat.zona;
    const zonaObj = zonas.find(z => (z.id || z._id) === zonaId);

    if (blockMode) {
      const action = seat.estado === 'bloqueado' ? 'unblock' : 'block';
      if (exists) {
        setCarrito(
          carrito.filter(
            i => !(i._id === seat._id && i.funcionId === currentFuncId)
          )
        );
        setTempBlocks(tempBlocks.filter(id => id !== seat._id));
      } else {
        setCarrito([
          ...carrito,
          {
            _id: seat._id,
            nombre: seat.nombre,
            nombreMesa: table.nombre,
            zona: zonaObj?.nombre || seat.zona,
            action,
            funcionId: currentFuncId,
            funcionFecha: selectedFuncion?.fechaCelebracion,
          },
        ]);
        setTempBlocks([...tempBlocks, seat._id]);
      }
      return;
    }

    // Determine pricing from the selected plantilla
    const detalle = detallesPlantilla.find(d => {
      const id = d.zonaId || (typeof d.zona === 'object' ? d.zona._id : d.zona);
      return id === zonaId;
    });
    const basePrice = detalle?.precio || 0;

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
      setCarrito(
        carrito.filter(
          (i) => !(i._id === seat._id && i.funcionId === currentFuncId)
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          _id: seat._id,
          nombre: seat.nombre,
          nombreMesa: table.nombre,
          zona: zonaObj?.nombre || seat.zona,
          precio: finalPrice,
          tipoPrecio,
          descuentoNombre,
          funcionId: currentFuncId,
          funcionFecha: selectedFuncion?.fechaCelebracion,
        },
      ]);
    }
  };

  useEffect(() => {
    if (!blockMode) {
      setTempBlocks([]);
      setCarrito(carrito.filter(i => !i.action));
    }
  }, [blockMode]);

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
    if (!detalle) return;

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

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <select
          className="border p-2 rounded text-sm"
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
            src={`${process.env.REACT_APP_API_URL}${selectedEvent.imagenes.logoCuadrado}`}
            alt="Evento"
            className="w-10 h-10 object-cover rounded"
          />
        )}
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
            {new Date(selectedFuncion.fechaCelebracion).toLocaleString()}
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

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setViewMode('map')}
          className={`px-3 py-1 rounded ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Mapa
        </button>
        <button
          type="button"
          onClick={() => setViewMode('zonas')}
          className={`px-3 py-1 rounded ${viewMode === 'zonas' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Zonas
        </button>
      </div>

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
        <label className="ml-4 text-sm flex items-center gap-1">
          <input
            type="checkbox"
            checked={blockMode}
            onChange={e => setBlockMode(e.target.checked)}
          />
          Bloquear asientos
        </label>
      </div>

      {viewMode === 'map' ? (
        mapa ? (
          <>
            {zonas.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {zonas.map(z => {
                  const id = z.id || z._id;
                  return (
                    <div key={id} className="flex rounded overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setSelectedZonaId(id === selectedZonaId ? null : id)}
                        className={`px-2 py-1 text-sm ${selectedZonaId === id ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                      >
                        {z.nombre}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSingleZoneTicket(z)}
                        className="px-2 py-1 bg-green-600 text-white text-sm"
                      >
                        +
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {Object.keys(zonePriceRanges).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {Object.values(zonePriceRanges).map(zr => (
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
            />
          </>
        ) : (
          <p className="text-center text-gray-500">No hay mapa disponible</p>
        )
      ) : (
        <div className="overflow-x-auto">
          {detallesPlantilla.length ? (
            <table className="min-w-full text-sm border">
              <thead>
                <tr>
                  <th className="border px-2 py-1 text-left">Zona</th>
                  <th className="border px-2 py-1 text-right">Precio</th>
                  <th className="border px-2 py-1 text-center">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {detallesPlantilla.map((d) => {
                  const zonaId = d.zonaId || (typeof d.zona === 'object' ? d.zona._id : d.zona);
                  const zonaNombre = d.zona?.nombre || d.zonaId || d.zona;
                  const precio = getPrecioConDescuento(d);
                  return (
                    <tr key={zonaId}>
                      <td className="border px-2 py-1">{zonaNombre}</td>
                      <td className="border px-2 py-1 text-right">${precio.toFixed(2)}</td>
                      <td className="border px-2 py-1 text-center">
                        <input
                          type="number"
                          min="1"
                          className="border p-1 w-16 mr-2"
                          value={zoneQuantities[zonaId] || ''}
                          onChange={(e) => handleQuantityChange(zonaId, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddZoneToCart(d)}
                          className="px-2 py-1 bg-blue-600 text-white rounded"
                        >
                          Añadir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500">No hay plantilla de precios</p>
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
  );
};

export default ZonesAndPrices;
