import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const slugify = str =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const EventListWidget = () => {
  const [eventos, setEventos] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { venueId: tagSlug } = useParams();
  const { refParam } = useRefParam();
  const normalizedTagSlug = tagSlug ? tagSlug.toLowerCase() : null;
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evRes, tagRes] = await Promise.all([
          fetch(`${API_URL}/api/events`),
          fetch(`${API_URL}/api/tags`)
        ]);
        if (!evRes.ok) throw new Error('Error al obtener los eventos');
        if (!tagRes.ok) throw new Error('Error al obtener tags');
        const evData = await evRes.json();
        const tagData = await tagRes.json();
        setEventos(evData);
        setTags(tagData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const eventosPorTag = normalizedTagSlug
    ? (() => {
        const tag = tags.find(t => slugify(t.name) === normalizedTagSlug);
        if (!tag) return [];
        const evts = filteredEventos.filter(e => (e.tags || []).includes(tag._id));
        return evts.length ? [{ tag, eventos: evts }] : [];
      })()
    : tags.reduce((acc, tag) => {
        const evts = filteredEventos.filter(e => (e.tags || []).includes(tag._id));
        if (evts.length) acc.push({ tag, eventos: evts });
        return acc;
      }, []);

  const currentTag = normalizedTagSlug
    ? tags.find(t => slugify(t.name) === normalizedTagSlug)
    : null;

  return (
    <div className="events-venue" key="event-list">
      <h1>
        {currentTag ? `Eventos - ${currentTag.name}` : 'Eventos Disponibles'}
      </h1>
      {eventosPorTag.length > 0 ? (
        eventosPorTag.map(grp => (
          <div key={grp.tag._id} className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{grp.tag.name}</h2>
            <ul>
              {grp.eventos.map(evento => (
                <li
                  key={evento._id}
                  onClick={() => handleEventClick(evento.slug || evento._id)}
                  className="mb-4 cursor-pointer"
                >
                  {evento.imagenes?.portada && (
                    <img
                      src={`${API_URL}${evento.imagenes.portada}`}
                      alt={`Portada de ${evento.nombre}`}
                      className="w-full max-w-xs h-auto object-cover mb-2"
                    />
                  )}
                  <h3>{evento.nombre}</h3>
                  {evento.resumenDescripcion && (
                    <p className="mt-1 text-sm">{evento.resumenDescripcion}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>No se encontraron eventos.</p>
      )}
    </div>
  );
};

export default EventListWidget;
