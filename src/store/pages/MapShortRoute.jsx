import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const MapShortRoute = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const funcion = searchParams.get('funcion');
    if (funcion) {
      navigate(`/store/seat-selection/_/${parseInt(funcion, 10)}`, { replace: true });
    } else {
      navigate('/store', { replace: true });
    }
  }, [navigate, searchParams]);

  return null;
};

export default MapShortRoute;


