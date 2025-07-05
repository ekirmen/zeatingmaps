import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import resolveImageUrl from '../../utils/resolveImageUrl';
import { supabase } from '../../supabaseClient';
import { isUuid } from '../../utils/isUuid';
import { getFunciones } from '../services/apistore';
import formatDateString from '../../utils/formatDateString';

const EventInfo = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);

  useEffect(() => {
    const fetchEvento = async () => {
      const query = supabase.from('eventos').select('*');
      const { data, error } = await (
        isUuid(eventId) ? query.eq('id', eventId) : query.ilike('slug', eventId)
      ).maybeSingle();
      if (!error) setEvento(data);
    };
    fetchEvento();
  }, [eventId]);

  useEffect(() => {
    const fetchFunciones = async () => {
      const id = evento?.id || (isUuid(eventId) ? eventId : null);
      if (!id) return;
      const data = await getFunciones(id);
      setFunciones(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 1) {
        setSelectedFunctionId(data[0].id || data[0]._id);
      }
    };
    if (evento?.id || isUuid(eventId)) fetchFunciones();
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
          <label key={f.id || f._id} className="flex items-center gap-2">
            <input
              type="radio"
              name="funcion"
              value={f.id || f._id}
              onChange={() => setSelectedFunctionId(f.id || f._id)}
            />
            <span>{formatDateString(f.fechaCelebracion)}</span>
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
