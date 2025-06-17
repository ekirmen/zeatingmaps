import { useEffect, useState } from 'react';
import { fetchEventos } from '../services/eventoService';
import EventoForm from '../components/Evento/EventoForm';

const EventoListPage = () => {
  const [eventos, setEventos] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetchEventos(token).then(data => setEventos(data));
  }, []);

  return (
    <div>
      <button onClick={() => setShowForm(true)}>Create New Event</button>
      {showForm && <EventoForm onSuccess={() => setShowForm(false)} />}
      {/* Event list */}
    </div>
  );
};

export default EventoListPage;