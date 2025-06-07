import React, { useState, useEffect } from 'react';
import { Stage, Layer, Circle, Text } from 'react-konva';
import { useParams, useNavigate } from 'react-router-dom';
// Remove unused import
// import { Rect } from 'react-konva';
import { fetchMapa }  from '../services/apistore'; // Asegúrate de importar fetchMapa
const SelectSeats = () => {
  const { salaId } = useParams();
  const navigate = useNavigate();
  const [mesas, setMesas] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
// Removed unused state since seats and setSeats are not being used
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state

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

  const toggleSeatSelection = (seat) => {
    if (selectedSeats.some(s => s._id === seat._id)) {
      setSelectedSeats(selectedSeats.filter(s => s._id !== seat._id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const irAlCarrito = () => {
    navigate('/store/cart', { state: { selectedSeats } });
  };

  if (loading) return <p>Cargando asientos...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Seleccionar Asientos - Sala {salaId}</h1>
      <Stage width={window.innerWidth} height={window.innerHeight - 200}>
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
                      fill={selectedSeats.some(s => s._id === silla._id) ? 'blue' : 'gray'}
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
      <button onClick={irAlCarrito} style={{ marginTop: '20px' }}>Ir al carrito</button>
    </div>
  );
};

export default SelectSeats;