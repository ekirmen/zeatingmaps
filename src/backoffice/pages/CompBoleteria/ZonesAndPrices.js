import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import SeatingMap from './SeatingMap';
import { fetchMapa, fetchZonasPorSala } from '../../../services/supabaseServices';
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

  useEffect(() => {
    const loadData = async () => {
      const salaId = selectedFuncion?.sala?._id || selectedFuncion?.sala;
      const funcionId = selectedFuncion?.id || selectedFuncion?._id;
      if (salaId) {
        try {
          const [m, zs] = await Promise.all([
            fetchMapa(salaId, funcionId),
            fetchZonasPorSala(salaId),
          ]);
          setMapa(m);
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
    const exists = carrito.find((i) => i._id === seat._id);
    if (exists) {
      setCarrito(carrito.filter((i) => i._id !== seat._id));
    } else {
      setCarrito([
        ...carrito,
        {
          _id: seat._id,
          nombre: seat.nombre,
          nombreMesa: table.nombre,
          zona: seat.zona,
        },
      ]);
    }
  };

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

  const getPrecioConDescuento = (detalle) => {
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
    const items = Array.from({ length: qty }).map((_, idx) => ({
      _id: `${zonaId}-${Date.now()}-${idx}`,
      nombre: '',
      nombreMesa: '',
      zona: zonaNombre,
      precio,
    }));
    setCarrito([...carrito, ...items]);
    setZoneQuantities(prev => ({ ...prev, [zonaId]: '' }));
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
      </div>

      {viewMode === 'map' ? (
        mapa ? (
          <>
            {zonas.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {zonas.map(z => {
                  const id = z.id || z._id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedZonaId(id === selectedZonaId ? null : id)}
                      className={`px-2 py-1 rounded text-sm ${selectedZonaId === id ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                      {z.nombre}
                    </button>
                  );
                })}
              </div>
            )}
            <SeatingMap
              mapa={mapa}
              onSeatClick={handleSeatClick}
              selectedZona={zonas.find(z => (z.id || z._id) === selectedZonaId) || null}
              availableZonas={selectedZonaId ? [selectedZonaId] : zonas.map(z => z.id || z._id)}
            />
          </>
        ) : (
          <p className="text-center text-gray-500">No hay mapa disponible</p>
        )
      ) : (
        <div className="overflow-x-auto">
          {selectedPlantilla?.detalles?.length ? (
            <table className="min-w-full text-sm border">
              <thead>
                <tr>
                  <th className="border px-2 py-1 text-left">Zona</th>
                  <th className="border px-2 py-1 text-right">Precio</th>
                  <th className="border px-2 py-1 text-center">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {selectedPlantilla.detalles.map((d) => {
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
