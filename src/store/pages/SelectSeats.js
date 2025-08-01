import React, { useState, useEffect } from 'react';
import { Stage, Layer, Circle, Text } from 'react-konva';
import { useParams, useNavigate } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { fetchMapa }  from '../services/apistore';
import SeatSelectionTimer from '../components/SeatSelectionTimer';
const SelectSeats = () => {
  const { salaId, funcionId } = useParams();
  const navigate = useNavigate();
  const { refParam } = useRefParam();
  const [mesas, setMesas] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await fetchMapa(salaId);
        if (!data || !data.contenido) {
          throw new Error('Datos no válidos o vacíos');
        }
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
    const updateSize = () => {
      const width = window.innerWidth < 640 ? window.innerWidth * 0.95 : window.innerWidth * 0.6;
      const height = window.innerWidth < 640 ? window.innerHeight * 0.6 : window.innerHeight * 0.7;
      setStageSize({ width, height });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const toggleSeatSelection = (seat) => {
    if (['reservado', 'pagado', 'seleccionado', 'bloqueado'].includes(seat.estado)) {
      return;
    }
    if (selectedSeats.some(s => s._id === seat._id)) {
      setSelectedSeats(selectedSeats.filter(s => s._id !== seat._id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const irAPagar = () => {
    const path = refParam ? `/store/payment?ref=${refParam}` : '/store/payment';
    navigate(path, { state: { carrito: selectedSeats, funcionId } });
  };

  const handleSeatsCleared = () => {
    setSelectedSeats([]);
  };

  const handleTimeExpired = () => {
    // Opcional: realizar acciones adicionales cuando se agota el tiempo
    console.log('Tiempo agotado - asientos liberados automáticamente');
  };

  if (loading) return <p>Cargando asientos...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <SeatSelectionTimer 
        selectedSeats={selectedSeats}
        onSeatsCleared={handleSeatsCleared}
        onTimeExpired={handleTimeExpired}
      />
      <h1>Seleccionar Asientos - Sala {salaId}</h1>
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
              {mesa.sillas && mesa.sillas.map((silla, sillaIndex) => {
                const angle = (sillaIndex * 360) / mesa.sillas.length;
                const x = mesa.posicion.x + Math.cos((angle * Math.PI) / 180) * 50;
                const y = mesa.posicion.y + Math.sin((angle * Math.PI) / 180) * 50;

                return (
                  <React.Fragment key={silla._id}>
                    <Circle
                      x={x}
                      y={y}
                      radius={10}
                      fill={
                        silla.estado === 'reservado' ? '#555' :
                        silla.estado === 'pagado' ? 'gray' :
                        (silla.estado === 'seleccionado' || silla.estado === 'bloqueado') ? 'orange' :
                        selectedSeats.some(s => s._id === silla._id) ? 'blue' :
                        silla.color || 'lightblue'
                      }
                      stroke="black"
                      strokeWidth={1}
                      onClick={() => toggleSeatSelection(silla)}
                    />
                    <Text
                      x={x - 10}
                      y={y - 20}
                      text={`Silla ${sillaIndex + 1}`}
                      fontSize={12}
                      fill="black"
                      align="center"
                    />
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
        </Layer>
      </Stage>
      <h2>Carrito</h2>
      <ul>
        {selectedSeats.map(seat => (
          <li key={seat._id}>{seat.nombre} - {seat.zona} - ${seat.precio}</li>
        ))}
      </ul>
      <button
        onClick={irAPagar}
        className="mt-5 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Ir a pagar
      </button>
    </div>
  );
};

export default SelectSeats;