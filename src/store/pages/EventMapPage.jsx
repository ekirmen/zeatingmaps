import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import SeatSelectionPage from './SeatSelectionPage';

const EventMapPage = () => {
  const { eventSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const funcionParam = searchParams.get('funcion');

  const funcionId = useMemo(() => {
    if (!funcionParam) return null;
    const parsed = parseInt(funcionParam, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return String(parsed);
  }, [funcionParam]);

  useEffect(() => {
    if (!funcionId) {
      navigate(`/store/eventos/${eventSlug}`, { replace: true });
    }
  }, [eventSlug, funcionId, navigate]);

  if (!funcionId) {
    return null;
  }

  return (
    <SeatSelectionPage
      initialFuncionId={funcionId}
      autoRedirectToEventMap={false}
    />
  );
};

export default EventMapPage;
