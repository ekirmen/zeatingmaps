import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { fetchMapa, fetchMapaContent } from '../services/apistore';
import SeatSelectionTimer from '../components/SeatSelectionTimer';
import { useSeatLockStore } from '../../components/seatLockStore';
import { useCartStore } from '../cartStore';

// Lazy load del canvas pesado
const SelectSeatsCanvas = React.lazy(
  () => import(/* webpackChunkName: "canvas-seatmap" */ './SelectSeatsCanvas')
);

const SelectSeats = () => {
  const { salaId, funcionId } = useParams();
  const navigate = useNavigate();
  const { refParam } = useRefParam();

  // Estado optimizado
  const [mapa, setMapa] = useState(null);
  const [mapElements, setMapElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [processedElements, setProcessedElements] = useState([]);
  const [workerReady, setWorkerReady] = useState(false);

  // Stores optimizados
  const { items, toggleSeat, clearCart } = useCartStore();
  const { subscribeToFunction, lockSeat, unlockSeat, isSeatLocked, isSeatLockedByMe } =
    useSeatLockStore();

  const setVisibleSeats = useSeatLockStore(state => state.setVisibleSeats);
  const lockedSeats = useSeatLockStore(state => state.lockedSeats);
  const getSeatState = useSeatLockStore(state => state.getSeatState);

  // Memoize expensive computations
  const currentSessionId = useMemo(
    () => (typeof window !== 'undefined' ? localStorage.getItem('anonSessionId') : null),
    []
  );

  // 1. Carga inicial minimal
  useEffect(() => {
    let mounted = true;

    const cargarDatos = async () => {
      try {
        // Primero carga datos mínimos para mostrar algo rápido
        const minimal = await fetchMapa(salaId, 'sala', { minimal: true });

        if (!minimal) {
          const fallback = await fetchMapa(salaId);
          if (!fallback?.contenido) throw new Error('Datos no válidos o vacíos');

          if (mounted) {
            setMapa(fallback);
            const elementos = Array.isArray(fallback?.contenido)
              ? fallback.contenido
              : fallback.contenido?.elementos || [];
            setMapElements(elementos.filter(Boolean));
          }
        } else {
          if (mounted) {
            setMapa(minimal);
            setLoading(false); // Ya podemos mostrar la interfaz
          }

          // Carga pesada en segundo plano
          setTimeout(async () => {
            try {
              const contenido = await fetchMapaContent(salaId, 'sala');
              if (contenido && mounted) {
                const elementos = Array.isArray(contenido) ? contenido : contenido.elementos || [];
                setMapElements(elementos.filter(Boolean));
                setMapa(prev => ({ ...(prev || {}), contenido }));
              }
            } catch (err) {
              console.warn('Error cargando contenido detallado:', err);
            }
          }, 100); // Pequeño delay para priorizar UI
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (salaId) cargarDatos();

    return () => {
      mounted = false;
    };
  }, [salaId]);

  // 2. Worker para procesamiento pesado (lazy load)
  useEffect(() => {
    if (!mapElements.length || !window.Worker) {
      setProcessedElements(mapElements);
      return;
    }

    let mounted = true;
    let worker = null;

    const initWorker = async () => {
      try {
        // Lazy load del worker
        const WorkerModule = await import(
          /* webpackChunkName: "map-worker" */
          '../../workers/mapLayout.worker.js'
        );

        worker = new Worker(WorkerModule.default || WorkerModule);
        setWorkerReady(true);

        worker.addEventListener('message', ev => {
          if (!mounted) return;
          const { success, processed } = ev.data || {};
          if (success && Array.isArray(processed)) {
            setProcessedElements(processed);
          } else {
            // Fallback local
            setProcessedElements(computeLocally(mapElements));
          }
        });

        worker.postMessage({ mapElements, stageSize });
      } catch (err) {
        console.warn('Worker no disponible, usando cálculo local');
        setProcessedElements(computeLocally(mapElements));
      }
    };

    const computeLocally = elements => {
      try {
        return elements.map(elemento => {
          if (!elemento) return elemento;

          if (elemento.type === 'mesa' && Array.isArray(elemento.sillas)) {
            const mesa = { ...elemento };
            const cx = mesa.posicion?.x || 0;
            const cy = mesa.posicion?.y || 0;
            const radius = mesa.radio || 50;
            const total = mesa.sillas.length;

            mesa.sillas = mesa.sillas.map((silla, idx) => {
              const angle = (idx * 360) / total;
              const rad = (angle * Math.PI) / 180;
              const x = cx + Math.cos(rad) * radius;
              const y = cy + Math.sin(rad) * radius;
              return {
                ...silla,
                _computed: { x, y, angle },
                _id: silla._id || silla.id || silla.sillaId,
              };
            });
            return mesa;
          }

          if (['zona', 'fila', 'grada'].includes(elemento.type)) {
            return {
              ...elemento,
              _computed: {
                x: elemento.posicion?.x || 0,
                y: elemento.posicion?.y || 0,
              },
            };
          }

          return elemento;
        });
      } catch (err) {
        return elements;
      }
    };

    // Solo inicializar worker si tenemos suficientes elementos
    if (mapElements.length > 10) {
      initWorker();
    } else {
      setProcessedElements(computeLocally(mapElements));
    }

    return () => {
      mounted = false;
      if (worker) worker.terminate();
    };
  }, [mapElements, stageSize]);

  // 3. Tamaño del stage
  useEffect(() => {
    const sidebarWidth = 300;
    const updateSize = () => {
      const width = Math.max(window.innerWidth - sidebarWidth, 400);
      const height = window.innerHeight;
      setStageSize({ width, height });
    };

    updateSize();
    const resizeHandler = () => requestAnimationFrame(updateSize);
    window.addEventListener('resize', resizeHandler);

    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  // 4. Suscripción a función
  useEffect(() => {
    if (funcionId) {
      subscribeToFunction(funcionId);
    }
  }, [funcionId, subscribeToFunction]);

  // 5. Asientos visibles (optimizado)
  useEffect(() => {
    if (!mapElements.length) return;

    const updateVisibleSeats = () => {
      try {
        const width = stageSize.width || window.innerWidth;
        const height = stageSize.height || window.innerHeight;
        const visibleIds = new Set();
        const elements = processedElements.length ? processedElements : mapElements;

        elements.forEach(el => {
          if (!el || !el.type) return;

          if (el.type === 'mesa' && Array.isArray(el.sillas)) {
            el.sillas.forEach(silla => {
              const x = silla._computed?.x ?? silla.posicion?.x;
              const y = silla._computed?.y ?? silla.posicion?.y;

              if (typeof x === 'number' && typeof y === 'number') {
                // Buffer de 200px alrededor de la vista
                if (x >= -200 && x <= width + 200 && y >= -200 && y <= height + 200) {
                  visibleIds.add(silla._id || silla.id || silla.sillaId);
                }
              }
            });
          }
        });

        setVisibleSeats(Array.from(visibleIds));
      } catch (err) {
        console.warn('Error calculando asientos visibles:', err);
      }
    };

    const debouncedUpdate = () => requestAnimationFrame(updateVisibleSeats);
    debouncedUpdate();

    // Solo recalcular si cambia significativamente
    const resizeHandler = () => {
      if (performance.now() - (window.lastResize || 0) > 200) {
        debouncedUpdate();
        window.lastResize = performance.now();
      }
    };

    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, [processedElements, mapElements, stageSize, setVisibleSeats]);

  // Handlers optimizados
  const toggleSeatSelection = async seat => {
    if (['reservado', 'pagado'].includes(seat.estado)) return;

    const isLocked = await isSeatLocked(seat._id, funcionId);
    if (isLocked && !(await isSeatLockedByMe(seat._id, funcionId))) return;

    if (await isSeatLockedByMe(seat._id, funcionId)) {
      await unlockSeat(seat._id, funcionId);
      await toggleSeat({ ...seat, funcionId });
    } else {
      const ok = await lockSeat(seat._id, 'seleccionado', funcionId);
      if (ok) {
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
  };

  // Loading states optimizados
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600">Cargando mapa de asientos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const backgroundUrl = mapa?.backgroundImage || mapa?.image || mapa?.fondo || null;
  const elementsToRender = processedElements.length ? processedElements : mapElements;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Canvas principal */}
      <div
        className="flex-1 relative"
        style={{
          backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: backgroundUrl ? 'transparent' : '#f5f5f5',
        }}
      >
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-pulse rounded-full h-12 w-12 bg-blue-200 mb-2"></div>
                <p className="text-gray-600">Preparando mapa interactivo...</p>
              </div>
            </div>
          }
        >
          <SelectSeatsCanvas
            mapElements={elementsToRender}
            stageSize={stageSize}
            funcionId={funcionId}
            lockedSeats={lockedSeats}
            getSeatState={getSeatState}
            currentSessionId={currentSessionId}
            toggleSeatSelection={toggleSeatSelection}
            mapa={mapa}
            workerReady={workerReady}
          />
        </Suspense>
      </div>

      {/* Sidebar del carrito */}
      <div className="w-[300px] overflow-y-auto p-4 bg-white border-l border-gray-200">
        <SeatSelectionTimer
          selectedSeats={items}
          onSeatsCleared={handleSeatsCleared}
          onTimeExpired={handleTimeExpired}
        />

        <h2 className="text-lg font-semibold mb-3 text-gray-800">Carrito</h2>

        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay asientos seleccionados</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {items.map(seat => (
              <li
                key={seat._id || seat.id || seat.sillaId}
                className="p-2 bg-gray-50 rounded border border-gray-200"
              >
                <div className="font-medium text-gray-800">{seat.nombre}</div>
                <div className="text-sm text-gray-600">
                  {seat.zona || seat.nombreZona || 'General'} • ${seat.precio}
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <button
            onClick={irAPagar}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     transition-colors font-semibold shadow-sm hover:shadow"
          >
            Ir a pagar ({items.length})
          </button>
        )}
      </div>
    </div>
  );
};

export default SelectSeats;
