import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import SeatingMap from './SeatingMap';
import { fetchMapa, fetchZonasPorSala } from '../../services/apibackoffice';
import { fetchAbonoAvailableSeats } from '../../services/apibackoffice';

const ZonesAndPrices = ({
  eventos = [],
  selectedEvent,
  onEventSelect,
  funciones = [],
  onShowFunctions,
  selectedFuncion,
  selectedClient,
  abonos = [],
  carrito,
  setCarrito,
  selectedAffiliate,
  setSelectedAffiliate
}) => {
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
  const [abonoMode, setAbonoMode] = useState(false);
  const [abonoSeats, setAbonoSeats] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  const seatHasAbono = (seatId) => {
    return abonos.some(a => a.seat && (a.seat._id || a.seat) === seatId && a.status === 'activo');
  };



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

  useEffect(() => {
    const loadAbonoSeats = async () => {
      if (abonoMode && selectedEvent?._id) {
        try {
          const data = await fetchAbonoAvailableSeats(selectedEvent._id);
          setAbonoSeats(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error('Error loading abono seats:', err);
          setAbonoSeats([]);
        }
      } else {
        setAbonoSeats([]);
      }
    };
    loadAbonoSeats();
  }, [abonoMode, selectedEvent]);

  // Cargar mapa y zonas de la sala
  useEffect(() => {
    const loadSalaData = async () => {
      if (selectedFuncion?.sala?._id) {
        try {
          const [mapaData, zonasData] = await Promise.all([
            fetchMapa(selectedFuncion.sala._id, selectedFuncion._id),
            fetchZonasPorSala(selectedFuncion.sala._id)
          ]);

          if (mapaData && typeof mapaData === 'object') {
            setMapa(mapaData);
            setActiveMenu('Mapa');
          } else {
            setMapa(null);
            setActiveMenu('Zonas');
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

  // Cargar referidos
  useEffect(() => {
    const loadAffiliates = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/affiliate-users');
        if (res.ok) {
          const data = await res.json();
          setAffiliates(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error loading affiliates:', err);
      }
    };
    loadAffiliates();
  }, []);

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

    const groupKey = `${selectedEvent?._id || ''}-${silla._id}`;
    const seatInCart = carrito.some(item =>
      abonoMode ? item.abonoGroup === groupKey :
        (item._id === silla._id && item.funcionId === selectedFuncion?._id && !item.abonoGroup)
    );

    if (seatInCart) {
      setCarrito(carrito.filter(item =>
        abonoMode ? item.abonoGroup !== groupKey :
          !(item._id === silla._id && item.funcionId === selectedFuncion?._id && !item.abonoGroup)
      ));
    } else {
      const basePrice = selectedPrecio.precio;
      const abonoActive = seatHasAbono(silla._id);
      let finalPrice = abonoActive ? 0 : basePrice;
      let tipoPrecio = abonoMode ? 'abono' : abonoActive ? 'abono' : 'normal';
      let descuentoNombre = abonoMode ? 'Abono' : abonoActive ? 'Abono' : '';
      if (!abonoActive && appliedDiscount?.detalles) {
        const det = appliedDiscount.detalles.find(d => {
          const id = typeof d.zona === 'object' ? d.zona._id : d.zona;
          return id === selectedZona._id;
        });
        if (det) {
          if (det.tipo === 'porcentaje') {
            finalPrice = Math.max(0, basePrice - (basePrice * det.valor / 100));
          } else {
            finalPrice = Math.max(0, basePrice - det.valor);
          }
          tipoPrecio = 'descuento';
          descuentoNombre = appliedDiscount.nombreCodigo;
        }
      }
      if (abonoMode) {
        const seatsToAdd = funciones.map(func => ({
          ...silla,
          nombreMesa: mesa.nombre,
          zona: selectedZona.nombre,
          zonaId: selectedZona._id,
          precio: finalPrice,
          tipoPrecio,
          descuentoNombre,
          plantillaId: selectedPlantilla._id,
          funcionId: func._id,
          funcionFecha: func.fechaCelebracion,
          abonoGroup: groupKey
        }));
        setCarrito([...carrito, ...seatsToAdd]);
      } else {
        setCarrito([
          ...carrito,
          {
            ...silla,
            nombreMesa: mesa.nombre,
            zona: selectedZona.nombre,
            zonaId: selectedZona._id,
            precio: finalPrice,
            tipoPrecio,
            descuentoNombre,
            plantillaId: selectedPlantilla._id,
            funcionId: selectedFuncion?._id,
            funcionFecha: selectedFuncion?.fechaCelebracion
          }
        ]);
      }
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
    const groupKey = `${selectedEvent?._id || ''}-${silla._id}`;
    const seatInCart = carrito.some(item =>
      abonoMode ? item.abonoGroup === groupKey :
        (item._id === silla._id && item.funcionId === selectedFuncion?._id && !item.abonoGroup)
    );

    if (seatInCart) {
      setCarrito(carrito.filter(item =>
        abonoMode ? item.abonoGroup !== groupKey :
          !(item._id === silla._id && item.funcionId === selectedFuncion?._id && !item.abonoGroup)
      ));
    } else {
      const basePrice = detallePrecio.precio;
      const abonoActive = seatHasAbono(silla._id);
      let finalPrice = abonoActive ? 0 : basePrice;
      let tipoPrecio = abonoMode ? 'abono' : abonoActive ? 'abono' : 'normal';
      let descuentoNombre = abonoMode ? 'Abono' : abonoActive ? 'Abono' : '';
      if (!abonoActive && appliedDiscount?.detalles) {
        const det = appliedDiscount.detalles.find(d => {
          const id = typeof d.zona === 'object' ? d.zona._id : d.zona;
          return id === zonaObj?._id;
        });
        if (det) {
          if (det.tipo === 'porcentaje') {
            finalPrice = Math.max(0, basePrice - (basePrice * det.valor / 100));
          } else {
            finalPrice = Math.max(0, basePrice - det.valor);
          }
          tipoPrecio = 'descuento';
          descuentoNombre = appliedDiscount.nombreCodigo;
        }
      }
      if (abonoMode) {
        const seatsToAdd = funciones.map(func => ({
          ...silla,
          nombreMesa: silla.mesaNombre || '',
          zona: zonaObj?.nombre || '',
          zonaId: zonaObj?._id,
          precio: finalPrice,
          tipoPrecio,
          descuentoNombre,
          plantillaId: selectedPlantilla._id,
          funcionId: func._id,
          funcionFecha: func.fechaCelebracion,
          abonoGroup: groupKey
        }));
        setCarrito([...carrito, ...seatsToAdd]);
      } else {
        setCarrito([
          ...carrito,
          {
            ...silla,
            nombreMesa: silla.mesaNombre || '',
            zona: zonaObj?.nombre || '',
            zonaId: zonaObj?._id,
            precio: finalPrice,
            tipoPrecio,
            descuentoNombre,
            plantillaId: selectedPlantilla._id,
            funcionId: selectedFuncion?._id,
            funcionFecha: selectedFuncion?.fechaCelebracion
          },
        ]);
      }
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

    const newTickets = Array.from({ length: cantidad }).map((_, idx) => {
      const basePrice = detalle.precio;
      let finalPrice = basePrice;
      let tipoPrecio = 'normal';
      let descuentoNombre = '';
      if (appliedDiscount?.detalles) {
        const det = appliedDiscount.detalles.find(d => {
          const id = typeof d.zona === 'object' ? d.zona._id : d.zona;
          return id === zona._id;
        });
        if (det) {
          if (det.tipo === 'porcentaje') {
            finalPrice = Math.max(0, basePrice - (basePrice * det.valor / 100));
          } else {
            finalPrice = Math.max(0, basePrice - det.valor);
          }
          tipoPrecio = 'descuento';
          descuentoNombre = appliedDiscount.nombreCodigo;
        }
      }
      return {
        _id: `gen-${zona._id}-${Date.now()}-${idx}`,
        nombre: `Ticket ${zona.nombre}`,
        nombreMesa: '',
        zona: zona.nombre,
        zonaId: zona._id,
        precio: finalPrice,
        tipoPrecio,
        descuentoNombre,
        plantillaId: selectedPlantilla._id,
      };
    });

    setCarrito((prev) => [...prev, ...newTickets]);
  };

  const toggleTableSeats = (zonaId, mesaNombre) => {
    const seats = seatsByZone(zonaId).filter(s => s.mesaNombre === mesaNombre);
    seats.forEach(s => handleSeatClick(s, { nombre: mesaNombre }));
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
      {/* Selección de evento y tipo de entrada */}
      <div className="mb-4 flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <select
            className="border px-2 py-1 text-sm"
            value={selectedEvent?._id || ''}
            onChange={(e) => onEventSelect && onEventSelect(e.target.value)}
          >
            <option value="" disabled>
              Seleccionar Evento
            </option>
            {eventos.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.nombre}
              </option>
            ))}
          </select>
        {selectedEvent?.imagenes?.logoCuadrado && (
          <img
            src={`${process.env.REACT_APP_API_URL}${selectedEvent.imagenes.logoCuadrado}`}
            alt="Evento"
            className="w-10 h-10 object-cover rounded cursor-pointer"
            onClick={onShowFunctions}
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
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={abonoMode} onChange={() => setAbonoMode(!abonoMode)} />
          Abono
        </label>
      </div>
      {/* Menu Tabs */}
      <div className="flex items-center space-x-2 mb-4">
        {['Zonas', 'Mapa', 'Producto'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveMenu(tab)}
            className={`px-3 py-1 rounded-md text-sm focus:outline-none ${activeMenu === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
        <input
          type="text"
          value={discountCode}
          onChange={e => setDiscountCode(e.target.value)}
          placeholder="Código"
          className="border px-2 py-1 text-sm"
        />
        <button
          onClick={applyDiscountCode}
          className="px-2 py-1 bg-green-600 text-white rounded text-sm"
        >
          Aplicar
        </button>
        {appliedDiscount && (
          <span className="text-sm text-green-700">{appliedDiscount.nombreCodigo}</span>
        )}
        <button
          key="Referidos"
          onClick={() => setActiveMenu('Referidos')}
          className={`px-3 py-1 rounded-md text-sm focus:outline-none ${activeMenu === 'Referidos' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Referidos
        </button>
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
        </div>
      )}

      {activeMenu === 'Mapa' && (
        <div className="space-y-4">
            {selectedPlantilla ? (
              <div className="template-card selected">
                <h4>{selectedPlantilla.nombre}</h4>
                <div className="price-details flex gap-2 overflow-x-auto">
                  {selectedPlantilla.detalles
                    .filter((d) => !selectedEntrada || d.productoId === selectedEntrada)
                    .map((detalle) => {
                      const zona = zonas.find((z) => z._id === detalle.zonaId);
                      return (
                        <div
                          key={detalle._id}
                          className={`cursor-pointer px-3 py-2 border rounded text-sm flex flex-col items-center ${selectedPrecio?._id === detalle._id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}
                          onClick={() => {
                            handlePrecioSelect(detalle);
                            setOpenZone(detalle.zonaId);
                          }}
                        >
                          <span className="font-medium">{zona ? zona.nombre : `Unknown Zone (ID: ${detalle.zonaId})`}</span>
                          <span>${detalle.precio}</span>
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
            abonoMode={abonoMode}
            abonoSeats={abonoSeats}
          />
        </div>
      )}

      {activeMenu === 'Referidos' && (
        <div className="space-y-2">
          {affiliates.map(a => (
            <div
              key={a._id}
              onClick={() => setSelectedAffiliate(a)}
              className={`p-2 border rounded cursor-pointer flex justify-between ${selectedAffiliate?._id === a._id ? 'bg-blue-100' : 'bg-white'}`}
            >
              <span>{a.user.login}</span>
              <span>{Number(a.base || 0).toFixed(2)} + {a.percentage}%</span>
            </div>
          ))}
        </div>
      )}

      {activeMenu === 'Producto' && (
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
