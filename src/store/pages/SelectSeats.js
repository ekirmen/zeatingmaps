import React, { Suspense, useState, useEffect } from 'react';
// react-konva is large; defer loading to runtime so it doesn't inflate the initial bundle.
// We'll dynamically import it when this page mounts.
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

  const setVisibleSeats = useSeatLockStore(state => state.setVisibleSeats);

  // Read commonly used seat lock data once to avoid repeated calls inside render loops
  const lockedSeats = useSeatLockStore(state => state.lockedSeats);
  const getSeatState = useSeatLockStore(state => state.getSeatState);
  const currentSessionId = React.useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('anonSessionId') : null, []);

  // `react-konva` is imported inside the lazily loaded canvas component
  // to ensure Konva ends up in a separate chunk.

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

  const Canvas = React.lazy(() => import('./SelectSeatsCanvas'));
  const [processedElements, setProcessedElements] = useState([]);

  useEffect(() => {
    let mounted = true;
    let worker = null;

    try {
      worker = new Worker(new URL('../../workers/mapLayout.worker.js', import.meta.url));
    } catch (err) {
      console.warn('[SelectSeats] WebWorker not available, falling back to main-thread layout:', err);
    }

    const computeLocally = (elements) => {
      try {
        return elements.map((elemento) => {
          if (!elemento) return elemento;
          if (elemento.type === 'mesa' && Array.isArray(elemento.sillas)) {
            const mesa = { ...elemento };
            const cx = (mesa.posicion?.x || 0);
            const cy = (mesa.posicion?.y || 0);
            const radius = mesa.radio || 50;
            const total = mesa.sillas.length;
            mesa.sillas = mesa.sillas.map((silla, idx) => {
              const angle = (idx * 360) / total;
              const rad = (angle * Math.PI) / 180;
              const x = cx + Math.cos(rad) * radius;
              const y = cy + Math.sin(rad) * radius;
              return { ...silla, _computed: { x, y, angle } };
            });
            return mesa;
          }
          if (elemento.type === 'zona' || elemento.type === 'fila' || elemento.type === 'grada') {
            return { ...elemento, _computed: { x: elemento.posicion?.x || 0, y: elemento.posicion?.y || 0 } };
          }
          return elemento;
        });
      } catch (err) {
        console.warn('[SelectSeats] Local compute failed:', err);
        return elements;
      }
    };

    if (worker) {
      worker.addEventListener('message', (ev) => {
        if (!mounted) return;
        const { success, processed, error } = ev.data || {};
        if (success && Array.isArray(processed)) {
          setProcessedElements(processed);
        } else {
          console.warn('[SelectSeats] Worker processing failed:', error);
          setProcessedElements(computeLocally(mapElements));
        }
      });
    }

    // Kick off initial processing if we already have elements
    if (mapElements && mapElements.length) {
      if (worker) {
        worker.postMessage({ mapElements, stageSize });
      } else {
        setProcessedElements(computeLocally(mapElements));
      }
    } else {
      setProcessedElements([]);
    }

    return () => {
      mounted = false;
      if (worker) worker.terminate();
    };
  }, [mapElements, stageSize]);

  // Compute visible seats from processedElements and stage size to limit realtime locks
  useEffect(() => {
    try {
      const width = stageSize.width || window.innerWidth;
      const height = stageSize.height || window.innerHeight;
      const visibleIds = new Set();

      (processedElements.length ? processedElements : mapElements).forEach((el) => {
        if (!el) return;
        if (el.type === 'mesa' && Array.isArray(el.sillas)) {
          el.sillas.forEach((silla) => {
            const x = silla._computed?.x ?? silla.posicion?.x;
            const y = silla._computed?.y ?? silla.posicion?.y;
            if (typeof x === 'number' && typeof y === 'number') {
              if (x >= 0 && x <= width && y >= 0 && y <= height) {
                visibleIds.add(silla._id || silla.id || silla.sillaId);
              }
            }
          });
        }
      });

      setVisibleSeats(Array.from(visibleIds));
    } catch (err) {
      console.warn('[SelectSeats] Error computing visible seats:', err);
    }
  }, [processedElements, mapElements, stageSize, setVisibleSeats]);
  if (loading) return <p>Cargando asientos...</p>;
  if (error) return <p>Error: {error}</p>;

  const backgroundUrl = mapa?.backgroundImage || mapa?.image || mapa?.fondo || null;

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
        <Suspense fallback={<div>Cargando mapa...</div>}>
          <Canvas
            mapElements={processedElements.length ? processedElements : mapElements}
            stageSize={stageSize}
            funcionId={funcionId}
            lockedSeats={lockedSeats}
            getSeatState={getSeatState}
            currentSessionId={currentSessionId}
            toggleSeatSelection={toggleSeatSelection}
            mapa={mapa}
          />
        </Suspense>
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
