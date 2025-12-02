import React, { useState, useEffect } from 'react';
import { Stage, Layer, Circle, Rect, Text, Group } from 'react-konva';
import { useParams, useNavigate } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { fetchMapa, fetchMapaContent } from '../services/apistore';
import SeatSelectionTimer from '../components/SeatSelectionTimer';
import { useSeatLockStore } from '../../components/seatLockStore';
import { useCartStore } from '../cartStore';
const SelectSeats = () => {
  const { salaId, funcionId } = useParams();
  const navigate = useNavigate();
  const { refParam } = useRefParam();
  const [mapa, setMapa] = useState(null);
  const [mapElements, setMapElements] = useState([]);
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

  // Read commonly used seat lock data once to avoid repeated calls inside render loops
  const lockedSeats = useSeatLockStore(state => state.lockedSeats);
  const getSeatState = useSeatLockStore(state => state.getSeatState);
  const currentSessionId = React.useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('anonSessionId') : null, []);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // First load a minimal/lightweight version to reduce initial payload and LCP
        const minimal = await fetchMapa(salaId, 'sala', { minimal: true });
        if (!minimal) {
          // If there's no map metadata, try full fetch as fallback
          const fallback = await fetchMapa(salaId);
          if (!fallback || !fallback.contenido) throw new Error('Datos no válidos o vacíos');
          setMapa(fallback);
          const elementos = Array.isArray(fallback?.contenido) ? fallback.contenido : fallback.contenido?.elementos || [];
          setMapElements(elementos.filter(Boolean));
        } else {
          // Use metadata initially (will not include contenido)
          setMapa(minimal);
          // Start loading heavy content in background
          setLoading(true);
          fetchMapaContent(salaId, 'sala').then((contenido) => {
            if (contenido) {
              const elementos = Array.isArray(contenido) ? contenido : contenido.elementos || [];
              setMapElements(elementos.filter(Boolean));
              // merge back into mapa so other code can access mapa.contenido
              setMapa(prev => ({ ...(prev || {}), contenido }));
            }
          }).catch(err => {
            console.warn('[SelectSeats] Error cargando contenido completo:', err);
          }).finally(() => setLoading(false));
        }
        
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
    const isLocked = await isSeatLocked(seat._id, funcionId);
    if (isLocked && !(await isSeatLockedByMe(seat._id, funcionId))) return;

    if (await isSeatLockedByMe(seat._id, funcionId)) {
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
            {mapElements.map((elemento, idx) => {
              if (elemento.type === 'zona' || elemento.type === 'grada' || elemento.type === 'fila') {
                const { posicion = {}, dimensiones = {}, nombre, estado, color } = elemento;
                const overlayColor =
                  estado === 'reservado'
                    ? '#666'
                    : estado === 'pagado'
                    ? '#999'
                    : estado === 'bloqueado'
                    ? 'orange'
                    : color || 'rgba(0, 128, 0, 0.35)';

                return (
                  <Group key={elemento._id || idx}>
                    <Rect
                      x={posicion.x || 0}
                      y={posicion.y || 0}
                      width={dimensiones.ancho || dimensiones.width || 60}
                      height={dimensiones.alto || dimensiones.height || 40}
                      fill={overlayColor}
                      stroke="black"
                      strokeWidth={1}
                      cornerRadius={4}
                    />
                    {nombre && (
                      <Text
                        x={(posicion.x || 0) + 6}
                        y={(posicion.y || 0) + 6}
                        text={nombre}
                        fontSize={12}
                        fill="black"
                      />
                    )}
                  </Group>
                );
              }

              if (elemento.type === 'mesa') {
                const mesa = elemento;
                return (
                  <React.Fragment key={mesa._id || idx}>
                    <Circle
                      x={mesa.posicion?.x || 0}
                      y={mesa.posicion?.y || 0}
                      radius={30}
                      fill={mesa.color || 'green'}
                      stroke="black"
                      strokeWidth={2}
                    />
                    <Text
                      x={(mesa.posicion?.x || 0) - 30}
                      y={(mesa.posicion?.y || 0) - 10}
                      text={mesa.nombre || `Mesa ${idx + 1}`}
                      fontSize={14}
                      fill="black"
                      align="center"
                    />

                    {mesa.sillas &&
                              mesa.sillas.map((silla, sillaIndex) => {
                                const angle = (sillaIndex * 360) / mesa.sillas.length;
                                const x =
                                  (mesa.posicion?.x || 0) +
                                  Math.cos((angle * Math.PI) / 180) * 50;
                                const y =
                                  (mesa.posicion?.y || 0) +
                                  Math.sin((angle * Math.PI) / 180) * 50;

                                // Use memoized values captured outside the map to avoid repeated calls
                                const isLockedByMe = lockedSeats.some(lock =>
                                  lock.seat_id === silla._id &&
                                  lock.funcion_id === funcionId &&
                                  lock.session_id === currentSessionId
                                );
                                const isLocked = lockedSeats.some(lock => lock.seat_id === silla._id);
                                const seatEstado = silla.estado || getSeatState?.(silla._id);

                        const fillColor = isLockedByMe
                          ? 'blue'
                          : isLocked
                          ? 'orange'
                          : seatEstado === 'reservado'
                          ? '#555'
                          : seatEstado === 'pagado'
                          ? 'gray'
                          : silla.color || 'lightblue';

                        return (
                          <React.Fragment key={silla._id || sillaIndex}>
                            <Circle
                              x={x}
                              y={y}
                              radius={10}
                              fill={fillColor}
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
                );
              }

              return null;
            })}
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
