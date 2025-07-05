import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import resolveImageUrl from '../../utils/resolveImageUrl';
import { supabase } from '../../supabaseClient';
import { isUuid, isNumericId } from '../../utils/isUuid';
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
      try {
        const query = supabase.from('eventos').select('*');
        const { data, error } = await (
          isUuid(eventId)
            ? query.eq('id', eventId)
            : isNumericId(eventId)
              ? query.eq('id', parseInt(eventId, 10))
              : query.ilike('slug', eventId)
        ).maybeSingle();
        if (error) throw error;
        setEvento(data);
      } catch (err) {
        console.error('Error fetching evento:', err);
      }
    };
    if (eventId) fetchEvento();
  }, [eventId]);

  useEffect(() => {
    const fetchFuncionesData = async () => {
      const id = evento?.id || (isUuid(eventId) ? eventId : parseInt(eventId));
      if (!id) return;
      try {
        const data = await getFunciones(id);
        setFunciones(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length === 1) {
          setSelectedFunctionId(data[0].id || data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching funciones:', err);
      }
    };
    if (evento) fetchFuncionesData();
  }, [evento, eventId]);

  const handleSelect = () => {
    if (selectedFunctionId) {
      navigate(`/store/event/${eventId}/map?funcion=${selectedFunctionId}`);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {(evento?.imagenes?.portada || evento?.imagenes?.banner) && (
        <img
          src={resolveImageUrl(evento.imagenes.portada || evento.imagenes.banner)}
          alt={evento?.nombre || ''}
          className="w-full rounded mb-6"
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
        <h3 className="text-lg font-semibold mb-3">{t('functions')}</h3>
        {funciones.map((f) => (
          <label key={f.id || f._id} className="flex items-center gap-2 mb-1">
            <input
              type="radio"
              name="funcion"
              value={f.id || f._id}
              checked={selectedFunctionId === (f.id || f._id)}
              onChange={() => setSelectedFunctionId(f.id || f._id)}
            />
            <span>{formatDateString(f.fechaCelebracion)}</span>
          </label>
        ))}
      </div>

      <button
        onClick={handleSelect}
        disabled={!selectedFunctionId}
        className="bg-blue-600 text-white px-5 py-2 rounded disabled:opacity-50"
      >
        {t('select_seats')}
      </button>
    </div>
  );
};

export default EventInfo;
