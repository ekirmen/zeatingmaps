import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const EventListWidget = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { refParam } = useRefParam();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';

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

  const filteredEventos = eventos.filter(e =>
    e.nombre.toLowerCase().includes(query.toLowerCase())
  );

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
      {filteredEventos.length > 0 ? (
        <ul>
          {filteredEventos.map(evento => (
            <li
              key={evento._id}
              onClick={() => handleEventClick(evento.slug || evento._id)}
            >
              {evento.imagenes?.portada && (
                <img
                  src={`${API_URL}${evento.imagenes.portada}`}
                  alt={`Portada de ${evento.nombre}`}
                  className="max-w-full h-auto mb-2"
                />
              )}
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
        <p>No se encontraron eventos.</p>
      )}
    </div>
  );
};

export default EventListWidget;
