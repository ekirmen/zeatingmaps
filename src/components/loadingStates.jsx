import React, { useState } from 'react';

/**
 * Sistema centralizado de loading states para diferentes tipos de carga
 */

export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  EMPTY: 'empty',
  REFRESHING: 'refreshing',
  UPDATING: 'updating',
  DELETING: 'deleting',
  CREATING: 'creating',
  SAVING: 'saving',
  UPLOADING: 'uploading',
  DOWNLOADING: 'downloading',
  VALIDATING: 'validating',
  PROCESSING: 'processing',
};

/**
 * Hook para manejar estados de carga específicos
 */
export const useLoadingState = (initialState = LOADING_STATES.IDLE) => {
  const [state, setState] = useState(initialState);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const setLoading = (loadingState = LOADING_STATES.LOADING) => {
    setState(loadingState);
    setError(null);
    setProgress(0);
  };

  const setSuccess = () => {
    setState(LOADING_STATES.SUCCESS);
    setError(null);
    setProgress(100);
  };

  const setErrorState = (errorMessage) => {
    setState(LOADING_STATES.ERROR);
    setError(errorMessage);
    setProgress(0);
  };

  const setIdle = () => {
    setState(LOADING_STATES.IDLE);
    setError(null);
    setProgress(0);
  };

  const setProgressValue = (value) => {
    setProgress(Math.min(100, Math.max(0, value)));
  };

  return {
    state,
    error,
    progress,
    isLoading: state === LOADING_STATES.LOADING || state === LOADING_STATES.REFRESHING,
    isSuccess: state === LOADING_STATES.SUCCESS,
    isError: state === LOADING_STATES.ERROR,
    isIdle: state === LOADING_STATES.IDLE,
    setLoading,
    setSuccess,
    setError: setErrorState,
    setIdle,
    setProgress: setProgressValue,
  };
};

/**
 * Componente de skeleton loader optimizado
 */
export const SkeletonLoader = ({
  type = 'text',
  width = '100%',
  height = '20px',
  count = 1,
  className = ''
}) => {
  const skeletons = Array.from({ length: count }).map((_, index) => (
    <div
      key={index}
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        borderRadius: type === 'circle' ? '50%' : '4px',
        marginBottom: count > 1 ? '8px' : '0',
      }}
    />
  ));

  return <>{skeletons}</>;
};

/**
 * Skeleton loader específico para tarjetas de evento
 */
export const EventCardSkeleton = () => (
  <div className="store-event-card" style={{ marginBottom: '24px' }}>
    <div className="skeleton-loader" style={{ height: '200px', borderRadius: '8px 8px 0 0' }} />
    <div style={{ padding: '16px' }}>
      <SkeletonLoader width="80%" height="24px" count={1} />
      <SkeletonLoader width="60%" height="16px" count={1} style={{ marginTop: '8px' }} />
      <SkeletonLoader width="40%" height="20px" count={1} style={{ marginTop: '16px' }} />
    </div>
  </div>
);

/**
 * Skeleton loader para lista de asientos
 */
export const SeatListSkeleton = ({ count = 10 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <SkeletonLoader type="circle" width="40px" height="40px" />
        <div style={{ flex: 1, marginLeft: '12px' }}>
          <SkeletonLoader width="60%" height="16px" count={1} />
          <SkeletonLoader width="40%" height="12px" count={1} style={{ marginTop: '4px' }} />
        </div>
      </div>
    ))}
  </>
);

/**
 * Loading state component con mensajes específicos
 */
export const LoadingState = ({
  state,
  message = null,
  error = null,
  children = null
}) => {
  const messages = {
    [LOADING_STATES.LOADING]: message || 'Cargando...',
    [LOADING_STATES.REFRESHING]: message || 'Actualizando...',
    [LOADING_STATES.UPDATING]: message || 'Actualizando...',
    [LOADING_STATES.DELETING]: message || 'Eliminando...',
    [LOADING_STATES.CREATING]: message || 'Creando...',
    [LOADING_STATES.SAVING]: message || 'Guardando...',
    [LOADING_STATES.UPLOADING]: message || 'Subiendo...',
    [LOADING_STATES.DOWNLOADING]: message || 'Descargando...',
    [LOADING_STATES.VALIDATING]: message || 'Validando...',
    [LOADING_STATES.PROCESSING]: message || 'Procesando...',
    [LOADING_STATES.EMPTY]: message || 'No hay datos disponibles',
    [LOADING_STATES.ERROR]: error || message || 'Ha ocurrido un error',
    [LOADING_STATES.SUCCESS]: message || 'Completado',
  };

  if (state === LOADING_STATES.IDLE || state === LOADING_STATES.SUCCESS) {
    return children;
  }

  if (state === LOADING_STATES.ERROR) {
    return (
      <div className="loading-state error">
        <p>{messages[state]}</p>
      </div>
    );
  }

  if (state === LOADING_STATES.EMPTY) {
    return (
      <div className="loading-state empty">
        <p>{messages[state]}</p>
      </div>
    );
  }

  return (
    <div className="loading-state loading">
      <div className="loading-spinner" />
      <p>{messages[state]}</p>
    </div>
  );
};

export default {
  LOADING_STATES,
  useLoadingState,
  SkeletonLoader,
  EventCardSkeleton,
  SeatListSkeleton,
  LoadingState,
};

