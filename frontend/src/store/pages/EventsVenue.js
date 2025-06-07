import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';

const EventsVenue = ({ onShowLoginModal, onLogin, onLogout }) => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/events');
        if (!response.ok) {
          throw new Error('Error al obtener los eventos');
        }
        const data = await response.json();
        setEventos(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, []);

  const handleEventClick = (id) => {
    navigate(`/store/event/${id}`); // Redirigir a la página de detalles del evento
  };

  if (loading) {
    return <div>Cargando eventos...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="event-container">
      <Header 
        onShowLoginModal={onShowLoginModal}
        onLogin={onLogin}
        onLogout={onLogout}
      />
      <div className="events-venue">
        <h1>Eventos Disponibles</h1>
        {eventos.length > 0 ? (
          <ul>
            {eventos.map((evento) => (
              <li key={evento._id} onClick={() => handleEventClick(evento._id)}>
                <h2>{evento.nombre}</h2>
                <p><strong>Sector:</strong> {evento.sector}</p>
                <p><strong>Recinto:</strong> {evento.recinto}</p>
                <p><strong>Sala:</strong> {evento.sala}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay eventos disponibles.</p>
        )}
      </div>
    </div>
  );
};

export default EventsVenue;