import React from 'react';
import { SeatMapSkeleton } from './SkeletonLoaders';
import LoadOnVisible from './LoadOnVisible';

// Use LoadOnVisible so the heavy SeatingMapUnified bundle is only requested
// when the map placeholder enters the viewport.
const LazySeatingMap = (props) => {
  return (
    <LoadOnVisible
      loader={() => import('./SeatingMapUnified')}
      fallback={<SeatMapSkeleton />}
      rootMargin="400px"
      loaderProps={props}
    />
  );
};

export default LazySeatingMap;

