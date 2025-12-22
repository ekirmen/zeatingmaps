import React from 'react';
import { SeatMapSkeleton } from './SkeletonLoaders';
import LoadOnVisible from './LoadOnVisible';

// Use LoadOnVisible so the heavy SeatingMapUnified bundle is only requested
// when the map placeholder enters the viewport.
// Reducir rootMargin para cargar más rápido cuando está visible
// Define loader outside to ensure stable reference across renders
const seatingMapLoader = () => import('./SeatingMapViewer');

const LazySeatingMap = (props) => {
  return (
    <LoadOnVisible
      loader={seatingMapLoader}
      fallback={<SeatMapSkeleton />}
      rootMargin="200px" // Reducido de 400px para cargar más rápido
      loaderProps={props}
    />
  );
};

export default LazySeatingMap;

