import React, { useState, useEffect } from 'react';
import { Stage, Layer, Circle, Text } from 'react-konva';
import { useParams, useNavigate } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { fetchMapa } from '../services/apistore';
import SeatSelectionTimer from '../components/SeatSelectionTimer';
import { useSeatLockStore } from '../../components/seatLockStore';
import { useCartStore } from '../cartStore';
const SelectSeats = () => {
  const { salaId, funcionId } = useParams();
  const navigate = useNavigate();
  const { refParam } = useRefParam();
  const [mapa, setMapa] = useState(null);
  const [mesas, setMesas] = useState([]);
  // Carrito global (persistente)
  const { items, toggleSeat, clearCart } = useCartStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const {
    subscribeToFunction,
    lockSeat,
    unlockSeat,
    isSeatLocked,
    isSeatLockedByMe,
  } = useSeatLockStore();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await fetchMapa(salaId);
        if (!data || !data.contenido) {
          throw new Error('Datos no válidos o vacíos');
        }
        setMapa(data);
        setMesas(data.contenido);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (salaId) cargarDatos();
  }, [salaId]);

  useEffect(() => {
    const sidebarWidth = 300; // ancho fijo para el carrito
    const updateSize = () => {
      const width = window.innerWidth - sidebarWidth;
      const height = window.innerHeight;
      setStageSize({ width, height });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (funcionId) {
      subscribeToFunction(funcionId);
    }
  }, [funcionId, subscribeToFunction]);

  const toggleSeatSelection = async (seat) => {
    if (['reservado', 'pagado'].includes(seat.estado)) return;

    // si está bloqueado por otro usuario no permitir selección
    if (isSeatLocked(seat._id) && !isSeatLockedByMe(seat._id)) return;

    if (isSeatLockedByMe(seat._id)) {
      await unlockSeat(seat._id, funcionId);
      // Quitar del carrito global
      await toggleSeat({ ...seat, funcionId });
    } else {
      const ok = await lockSeat(seat._id, 'seleccionado', funcionId);
      if (ok) {
        // Añadir al carrito global
        await toggleSeat({ ...seat, funcionId });
      }
    }
  };

  const irAPagar = () => {
    const path = refParam ? `/store/payment?ref=${refParam}` : '/store/payment';
    navigate(path, { state: { carrito: items, funcionId } });
  };

  const handleSeatsCleared = () => {
    clearCart();
  };

  const handleTimeExpired = () => {
    // Opcional: realizar acciones adicionales cuando se agota el tiempo
    console.log('Tiempo agotado - asientos liberados automáticamente');
  };

  if (loading) return <p>Cargando asientos...</p>;
  if (error) return <p>Error: {error}</p>;

  const backgroundUrl =
    mapa?.backgroundImage || mapa?.image || mapa?.fondo || null;

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className="flex-1 relative"
        style={{
          backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Stage width={stageSize.width} height={stageSize.height}>
          <Layer>
            {mesas.map((mesa, mesaIndex) => (
              <React.Fragment key={mesa._id}>
                {/* Dibujar la mesa */}
                <Circle
                  x={mesa.posicion.x}
                  y={mesa.posicion.y}
                  radius={30}
                  fill="green"
                  stroke="black"
                  strokeWidth={2}
                />
                <Text
                  x={mesa.posicion.x - 30}
                  y={mesa.posicion.y - 10}
                  text={`Mesa ${mesaIndex + 1}`}
                  fontSize={14}
                  fill="black"
                  align="center"
                />

                {/* Dibujar las sillas alrededor de la mesa */}
                {mesa.sillas &&
                  mesa.sillas.map((silla, sillaIndex) => {
                    const angle = (sillaIndex * 360) / mesa.sillas.length;
                    const x =
                      mesa.posicion.x +
                      Math.cos((angle * Math.PI) / 180) * 50;
                    const y =
                      mesa.posicion.y +
                      Math.sin((angle * Math.PI) / 180) * 50;

                    return (
                      <React.Fragment key={silla._id}>
                        <Circle
                          x={x}
                          y={y}
                          radius={10}
                          fill={
                            isSeatLockedByMe(silla._id)
                              ? 'blue'
                              : isSeatLocked(silla._id)
                              ? 'orange'
                              : silla.estado === 'reservado'
                              ? '#555'
                              : silla.estado === 'pagado'
                              ? 'gray'
                              : silla.color || 'lightblue'
                          }
                          stroke="black"
                          strokeWidth={1}
                          onClick={() => toggleSeatSelection(silla)}
                        />
                        <Text
                          x={x - 10}
                          y={y - 6}
                          text={`${sillaIndex + 1}`}
                          fontSize={12}
                          fill="black"
                          align="center"
                          width={20}
                        />
                      </React.Fragment>
                    );
                  })}
              </React.Fragment>
            ))}
          </Layer>
        </Stage>
      </div>
      <div className="w-[300px] overflow-y-auto p-4 bg-white">
        <SeatSelectionTimer
          selectedSeats={items}
          onSeatsCleared={handleSeatsCleared}
          onTimeExpired={handleTimeExpired}
        />
        <h2 className="text-lg font-semibold mb-2">Carrito</h2>
        <ul className="mb-4">
          {(items || []).map((seat) => (
            <li key={seat._id || seat.id || seat.sillaId}>
              {seat.nombre} - {seat.zona || seat.nombreZona || 'General'} - ${seat.precio}
            </li>
          ))}
        </ul>
        <button
          onClick={irAPagar}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Ir a pagar
        </button>
      </div>
    </div>
  );
};

export default SelectSeats;
