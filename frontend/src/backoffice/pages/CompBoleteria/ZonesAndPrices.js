import React, { useEffect, useState, useMemo } from 'react';
import { message } from 'antd';
import SeatingMap from './SeatingMap';
import { fetchMapa, fetchZonasPorSala } from '../../services/apibackoffice';

const ZonesAndPrices = ({ selectedFuncion, selectedClient, carrito, setCarrito }) => {
  const [mapa, setMapa] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [selectedPlantilla, setSelectedPlantilla] = useState(null);
  const [selectedZona, setSelectedZona] = useState(null);
  const [selectedPrecio, setSelectedPrecio] = useState(null);
  const [activeMenu, setActiveMenu] = useState('Zonas');
  const [openZone, setOpenZone] = useState(null); // zona desplegada
  const [zoneQuantities, setZoneQuantities] = useState({});
  const [entradas, setEntradas] = useState([]);
  const [selectedEntrada, setSelectedEntrada] = useState(null);
  const [blockMode, setBlockMode] = useState(false);

  const zonePriceRanges = useMemo(() => {
    const ranges = {};
    if (selectedPlantilla?.detalles) {
      selectedPlantilla.detalles.forEach((det) => {
        if (selectedEntrada && det.productoId !== selectedEntrada) return;
        const { zonaId, precio } = det;
        if (!ranges[zonaId]) {
          ranges[zonaId] = { min: precio, max: precio };
        } else {
          ranges[zonaId].min = Math.min(ranges[zonaId].min, precio);
          ranges[zonaId].max = Math.max(ranges[zonaId].max, precio);
        }
      });
    }
    return ranges;
  }, [selectedPlantilla, selectedEntrada]);


  // Cargar plantilla de precios específica de la función
  useEffect(() => {
    const cargarPlantillaPrecios = async () => {
      if (selectedFuncion?._id) {
        try {
          const response = await fetch(
            `http://localhost:5000/api/funcions/${selectedFuncion._id}/plantilla`
          );
          if (response.ok) {
            const data = await response.json();
            setSelectedPlantilla(data);
          }
        } catch (error) {
          console.error('Error loading function price template:', error);
          message.error('Error loading price template');
        }
      }
    };
    cargarPlantillaPrecios();
  }, [selectedFuncion]);

  // Cargar mapa y zonas de la sala
  useEffect(() => {
    const loadSalaData = async () => {
      if (selectedFuncion?.sala?._id) {
        try {
          const [mapaData, zonasData] = await Promise.all([
            fetchMapa(selectedFuncion.sala._id),
            fetchZonasPorSala(selectedFuncion.sala._id)
          ]);

          if (mapaData && typeof mapaData === 'object') {
            setMapa(mapaData);
          }

          if (Array.isArray(zonasData)) {
            const validatedZonas = zonasData.map(zona => ({
              ...zona,
              nombre: zona.nombre || 'Unnamed Zone'
            }));
            setZonas(validatedZonas);
            const qtys = {};
            validatedZonas.forEach(z => {
              qtys[z._id] = 1;
            });
            setZoneQuantities(qtys);
          }
        } catch (error) {
          message.error('Error loading sala data');
          setMapa(null);
          setZonas([]);
        }
      }
    };
    loadSalaData();
  }, [selectedFuncion]);

  // Cargar entradas (tipos de boleto) por recinto
  useEffect(() => {
    const loadEntradas = async () => {
      if (selectedFuncion?.sala?.recinto) {
        try {
          const res = await fetch(
            `http://localhost:5000/api/entradas/recinto/${selectedFuncion.sala.recinto}`
          );
          if (res.ok) {
            const data = await res.json();
            setEntradas(Array.isArray(data) ? data : []);
          }
        } catch (err) {
          console.error('Error loading entradas:', err);
        }
      } else {
        setEntradas([]);
      }
    };
    loadEntradas();
  }, [selectedFuncion]);

  // Seleccionar un precio (zona) para comprar
  const handlePrecioSelect = (detallePrecio) => {
    const zona = zonas.find(z => z._id === detallePrecio.zonaId);
    setSelectedZona(zona);
    setSelectedPrecio(detallePrecio);
  };

  const updateSeatState = (seatId, newEstado) => {
    setMapa(prev => ({
      ...prev,
      contenido: prev.contenido.map(mesaItem => ({
        ...mesaItem,
        sillas: mesaItem.sillas.map(s =>
          s._id === seatId ? { ...s, estado: newEstado } : s
        )
      }))
    }));
  };

  // Al hacer clic en una silla, agregar o quitar del carrito o bloquear
  const handleSeatClick = (silla, mesa) => {
    if (blockMode) {
      if (silla.estado === 'pagado') {
        message.error('Este asiento ya está vendido.');
        return;
      }
      const inCart = carrito.find(item => item._id === silla._id);
      const nuevoEstado = silla.estado === 'bloqueado' ? 'disponible' : 'bloqueado';
      updateSeatState(silla._id, nuevoEstado);
      setCarrito(prev =>
        inCart
          ? prev.filter(item => item._id !== silla._id)
          : [
              ...prev,
              {
                ...silla,
                nombreMesa: mesa.nombre,
                action: nuevoEstado === 'bloqueado' ? 'block' : 'unblock'
              }
            ]
      );
      return;
    }

    if (silla.estado === 'bloqueado') {
      message.error('Este asiento está bloqueado.');
      return;
    }

    if (!selectedClient) {
      message.warning('Please select a client first');
      return;
    }

    if (!selectedPrecio) {
      message.warning('Please select a price first');
      return;
    }

    const seatInCart = carrito.find(item => item._id === silla._id);
    if (seatInCart) {
      setCarrito(carrito.filter(item => item._id !== silla._id));
    } else {
      setCarrito([...carrito, {
        ...silla,
        nombreMesa: mesa.nombre,
        zona: selectedZona.nombre,
        zonaId: selectedZona._id,
        precio: selectedPrecio.precio,
        tipoPrecio: 'normal',
        plantillaId: selectedPlantilla._id
      }]);
    }
  };

  const addSeatFromList = (silla) => {
    if (blockMode) {
      handleSeatClick(silla, { nombre: silla.mesaNombre || '' });
      return;
    }
    if (silla.estado === 'bloqueado') {
      message.error('Este asiento está bloqueado.');
      return;
    }
    if (!selectedClient) {
      message.warning('Please select a client first');
      return;
    }

    const detallePrecio = selectedPlantilla?.detalles.find(
      (d) =>
        d.zonaId === silla.zona &&
        (!selectedEntrada || d.productoId === selectedEntrada)
    );
    if (!detallePrecio) {
      message.warning('Please select a price first');
      return;
    }

    const zonaObj = zonas.find((z) => z._id === silla.zona);
    const seatInCart = carrito.find((item) => item._id === silla._id);
    if (seatInCart) {
      setCarrito(carrito.filter((item) => item._id !== silla._id));
    } else {
      setCarrito([
        ...carrito,
        {
          ...silla,
          nombreMesa: silla.mesaNombre || '',
          zona: zonaObj?.nombre || '',
          zonaId: zonaObj?._id,
          precio: detallePrecio.precio,
          tipoPrecio: 'normal',
          plantillaId: selectedPlantilla._id,
        },
      ]);
    }
  };

  const addGeneralTickets = (zona) => {
    if (blockMode) return;
    const cantidad = Number(zoneQuantities[zona._id] || 0);
    if (!selectedClient) {
      message.warning('Please select a client first');
      return;
    }
    if (!cantidad || cantidad <= 0) {
      message.warning('Cantidad inválida');
      return;
    }
    const detalle = selectedPlantilla?.detalles.find(
      (d) =>
        d.zonaId === zona._id &&
        (!selectedEntrada || d.productoId === selectedEntrada)
    );
    if (!detalle) {
      message.warning('Please select a price first');
      return;
    }

    const current = carrito.filter((c) => c.zonaId === zona._id).length;
    if (current + cantidad > zona.aforo) {
      message.warning('Excede el aforo de la zona');
      return;
    }

    const newTickets = Array.from({ length: cantidad }).map((_, idx) => ({
      _id: `gen-${zona._id}-${Date.now()}-${idx}`,
      nombre: `Ticket ${zona.nombre}`,
      nombreMesa: '',
      zona: zona.nombre,
      zonaId: zona._id,
      precio: detalle.precio,
      tipoPrecio: 'normal',
      plantillaId: selectedPlantilla._id,
    }));

    setCarrito((prev) => [...prev, ...newTickets]);
  };

  const toggleTableSeats = (zonaId, mesaNombre) => {
    if (blockMode) {
      const seats = seatsByZone(zonaId).filter((s) => s.mesaNombre === mesaNombre);
      seats.forEach(s => handleSeatClick(s, { nombre: mesaNombre }));
      return;
    }
    if (!selectedClient) {
      message.warning('Please select a client first');
      return;
    }

    const detallePrecio = selectedPlantilla?.detalles.find(
      (d) =>
        d.zonaId === zonaId &&
        (!selectedEntrada || d.productoId === selectedEntrada)
    );
    if (!detallePrecio) {
      message.warning('Please select a price first');
      return;
    }

    const zonaObj = zonas.find((z) => z._id === zonaId);

    setCarrito((prev) => {
      const seats = seatsByZone(zonaId)
        .filter((s) => s.mesaNombre === mesaNombre && s.estado !== 'bloqueado');
      const allSelected = seats.every((s) => prev.some((c) => c._id === s._id));

      if (allSelected) {
        return prev.filter((c) => !seats.some((s) => s._id === c._id));
      }

      const newSeats = seats
        .filter((s) => !prev.some((c) => c._id === s._id))
        .map((s) => ({
          ...s,
          nombreMesa: s.mesaNombre || '',
          zona: zonaObj?.nombre || '',
          zonaId: zonaObj?._id,
          precio: detallePrecio.precio,
          tipoPrecio: 'normal',
          plantillaId: selectedPlantilla._id,
        }));

      return [...prev, ...newSeats];
    });
  };

  const seatsByZone = (zoneId) => {
    if (!mapa?.contenido) return [];
    const seats = [];
    mapa.contenido.forEach((mesa) => {
      mesa.sillas
        .filter((s) => s.zona === zoneId)
        .forEach((s) => seats.push({ ...s, mesaNombre: mesa.nombre }));
    });
    return seats;
  };


  return (
    <div className="center-content">
      {/* Tipo de Entrada */}
      <div className="mb-4 flex gap-4">
        {entradas.length > 0 && (
          <select
            className="border px-2 py-1 text-sm"
            value={selectedEntrada || ''}
            onChange={(e) => setSelectedEntrada(e.target.value)}
          >
            <option value="" disabled>
              Seleccionar Entrada
            </option>
            {entradas.map((ent) => (
              <option key={ent._id} value={ent._id}>
                {ent.producto}
              </option>
            ))}
          </select>
        )}
        <button
          className={`px-2 py-1 rounded text-sm ${blockMode ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          onClick={() => {
            setBlockMode(!blockMode);
            setCarrito([]);
          }}
        >
          {blockMode ? 'Desbloquear' : 'Bloquear'}
        </button>
      </div>
      {/* Menu Tabs */}
      <div className="flex items-center space-x-2 mb-4">
        {['Zonas', 'Mapa', 'Producto', 'Otros'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveMenu(tab)}
            className={`px-3 py-1 rounded-md text-sm focus:outline-none ${activeMenu === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
        <div className="ml-auto text-sm font-semibold">
          Tickets seleccionados: {carrito.length}
        </div>
      </div>

      {activeMenu === 'Zonas' && (
        <div className="price-templates-section space-y-4">
          {/* Lista de zonas con entradas */}
          {zonas.map((zona) => {
            const seats = seatsByZone(zona._id);
            const detalle = selectedPlantilla?.detalles.find(
              (d) =>
                d.zonaId === zona._id &&
                (!selectedEntrada || d.productoId === selectedEntrada)
            );
            const precioZona = detalle?.precio;
            const totalAforo = seats.length > 0 ? seats.length : zona.aforo;
            const ocupados = seats.filter((s) => ['pagado','reservado','bloqueado'].includes(s.estado)).length;
            const enCarrito = carrito.filter((c) => c.zonaId === zona._id).length;
            const disponibles = totalAforo - ocupados - enCarrito;

            if (seats.length === 0 && !detalle) return null; // Sin asientos ni precio

            if (seats.length === 0) {
              return (
                <div key={zona._id} className="border rounded p-2 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{zona.nombre}</span>
                    <span className="text-xs text-gray-500">Aforo: {totalAforo} | Disponibles: {disponibles}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={zona.aforo}
                      value={zoneQuantities[zona._id] || 1}
                      onChange={(e) =>
                        setZoneQuantities({
                          ...zoneQuantities,
                          [zona._id]: e.target.value,
                        })
                      }
                      className="w-20 border rounded px-2 py-1 text-sm"
                    />
                    <button
                      className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
                      onClick={() => addGeneralTickets(zona)}
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              );
            }

            const seatsByMesa = seats.reduce((acc, seat) => {
              acc[seat.mesaNombre] = acc[seat.mesaNombre] || [];
              acc[seat.mesaNombre].push(seat);
              return acc;
            }, {});

            return (
              <div key={zona._id} className="border rounded">
                <button
                  onClick={() => setOpenZone(openZone === zona._id ? null : zona._id)}
                  className="w-full flex justify-between items-center px-3 py-2 bg-gray-100"
                >
                  <span>
                    {zona.nombre}
                    <span className="ml-2 text-xs text-gray-500">Aforo: {totalAforo} | Disponibles: {disponibles}</span>
                  </span>
                  <span>{openZone === zona._id ? '-' : '+'}</span>
                </button>
                {openZone === zona._id && (
                  <div className="p-2 space-y-2 bg-white">
                    {Object.entries(seatsByMesa).map(([mesaNombre, sillasMesa]) => (
                      <div key={mesaNombre} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm">{mesaNombre}</span>
                          <button
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => toggleTableSeats(zona._id, mesaNombre)}
                          >
                            Seleccionar mesa completa
                          </button>
                        </div>
                        {sillasMesa.map((silla) => {
                          const inCart = carrito.some((c) => c._id === silla._id);
                          return (
                            <div
                              key={silla._id}
                              onClick={() => addSeatFromList(silla)}
                              className={`flex justify-between p-1 rounded cursor-pointer ${inCart ? 'bg-green-100' : 'hover:bg-gray-100'}`}
                            >
                              <span>{silla.nombre}</span>
                              <span>${precioZona ?? 0}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="mt-4 grid gap-2 text-sm">
            {Object.entries(zonePriceRanges).map(([zId, r]) => {
              const z = zonas.find((zn) => zn._id === zId);
              if (!z) return null;
              const rangeText = r.min === r.max ? `$${r.min}` : `$${r.min} - $${r.max}`;
              return (
                <div
                  key={zId}
                  className="px-3 py-2 rounded border flex justify-between"
                  style={{ borderColor: z.color }}
                >
                  <span>{z.nombre}</span>
                  <span>{rangeText}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeMenu === 'Mapa' && (
        <div className="space-y-4">
          <h3>Function Price Template</h3>
          {selectedPlantilla ? (
            <div className="template-card selected">
              <h4>{selectedPlantilla.nombre}</h4>
              <div className="price-details">
                {selectedPlantilla.detalles
                  .filter((d) => !selectedEntrada || d.productoId === selectedEntrada)
                  .map((detalle) => {
                  const zona = zonas.find((z) => z._id === detalle.zonaId);
                  return (
                    <div
                      key={detalle._id}
                      className={`price-item ${selectedPrecio?._id === detalle._id ? 'selected' : ''}`}
                      onClick={() => {
                        handlePrecioSelect(detalle);
                        setOpenZone(detalle.zonaId);
                      }}
                    >
                      <div className="price-item-content">
                        <span>{zona ? zona.nombre : `Unknown Zone (ID: ${detalle.zonaId})`}</span>
                        <span>${detalle.precio}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p>No price template assigned to this function</p>
          )}

          <SeatingMap
            mapa={mapa}
            onSeatClick={handleSeatClick}
            selectedZona={selectedZona}
            availableZonas={selectedZona ? [selectedZona._id] : []}
            blockMode={blockMode}
          />
        </div>
      )}

      {['Producto', 'Otros'].includes(activeMenu) && (
        <div className="p-4 text-center text-sm text-gray-600">No existen productos a la venta</div>
      )}

      {/* contador de tickets fijo en la esquina */}
      <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-1 rounded shadow-md text-sm">
        Tickets en carrito: {carrito.length}
      </div>
    </div>
  );
};

export default ZonesAndPrices;
