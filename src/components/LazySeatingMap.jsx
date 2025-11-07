import React, { Suspense, lazy } from 'react';
import { SeatMapSkeleton } from './SkeletonLoaders';

// Lazy load del componente de mapa (code splitting)
const SeatingMapUnified = lazy(() => import('./SeatingMapUnified'));

/**
 * Wrapper con lazy loading para SeatingMapUnified
 * Carga el componente solo cuando es necesario
 */
const LazySeatingMap = (props) => {
  return (
    <Suspense fallback={<SeatMapSkeleton />}>
      <SeatingMapUnified {...props} />
    </Suspense>
  );
};

export default LazySeatingMap;

