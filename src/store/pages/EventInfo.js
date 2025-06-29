import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import API_BASE_URL from '../../utils/apiBase';
import resolveImageUrl from '../../utils/resolveImageUrl';
import { supabase } from '../../backoffice/services/supabaseClient';
import { isUuid } from '../../utils/isUuid';

const EventInfo = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);

  useEffect(() => {
    const fetchEvento = async () => {
      const column = isUuid(eventId) ? 'id' : 'slug';
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq(column, eventId)
        .maybeSingle();
      if (!error) setEvento(data);
    };
    fetchEvento();
  }, [eventId]);

  useEffect(() => {
    const fetchFunciones = async () => {
      const id = evento?._id || eventId;
      const res = await fetch(`${API_BASE_URL}/api/funcions?evento=${id}`);
      const data = await res.json();
      setFunciones(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 1) {
        setSelectedFunctionId(data[0]._id);
      }
    };
    if (evento?._id || eventId) fetchFunciones();
  }, [evento, eventId]);

  return (
    <div className="p-4">
      {(evento?.imagenes?.portada || evento?.imagenes?.banner) && (
        <img
          src={resolveImageUrl(evento.imagenes.portada || evento.imagenes.banner)}
          alt={evento?.nombre || ''}
          className="w-full rounded mb-4"
        />
      )}
      <h1 className="text-3xl font-bold mb-4">{evento?.nombre}</h1>
      {evento?.descripcionHTML && (
        <div
          className="prose mb-6"
          dangerouslySetInnerHTML={{ __html: evento.descripcionHTML }}
        />
      )}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{t('functions')}</h3>
        {funciones.map((f) => (
          <label key={f._id} className="flex items-center gap-2">
            <input
              type="radio"
              name="funcion"
              value={f._id}
              onChange={() => setSelectedFunctionId(f._id)}
            />
            <span>{new Date(f.fechaCelebracion).toLocaleString()}</span>
          </label>
        ))}
      </div>
      <button
        onClick={() => navigate(`/store/event/${eventId}/map?funcion=${selectedFunctionId}`)}
        disabled={!selectedFunctionId}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {t('select_seats')}
      </button>
    </div>
  );
};

export default EventInfo;
