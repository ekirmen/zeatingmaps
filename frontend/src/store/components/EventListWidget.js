import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';

const EventListWidget = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { refParam } = useRefParam();

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/events');
        if (!response.ok) throw new Error('Error al obtener los eventos');
        const data = await response.json();
        setEventos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEventos();
  }, []);

  const handleEventClick = slugOrId => {
    const base = `/store/event/${slugOrId}`;
    const url = refParam ? `${base}?ref=${refParam}` : base;
    navigate(url);
  };

  if (loading) return <div>Cargando eventos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="events-venue" key="event-list">
      <h1>Eventos Disponibles</h1>
      {eventos.length > 0 ? (
        <ul>
          {eventos.map(evento => (
            <li
              key={evento._id}
              onClick={() => handleEventClick(evento.slug || evento._id)}
            >
              <h2>{evento.nombre}</h2>
              <p>
                <strong>Sector:</strong> {evento.sector}
              </p>
              <p>
                <strong>Recinto:</strong> {evento.recinto}
              </p>
              <p>
                <strong>Sala:</strong> {evento.sala}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay eventos disponibles.</p>
      )}
    </div>
  );
};

export default EventListWidget;
