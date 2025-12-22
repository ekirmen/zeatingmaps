
import React from 'react';
import { SeatMapSkeleton } from './SkeletonLoaders';
import LoadOnVisible from './LoadOnVisible';

// Use LoadOnVisible so the heavy SeatingMapEditor bundle is only requested
// when the map placeholder enters the viewport.
const LazySeatingMapEditor = (props) => {
    return (
        <LoadOnVisible
            loader={() => import('./SeatingMapEditor')}
            fallback={<SeatMapSkeleton />}
            rootMargin="200px"
            loaderProps={props}
        />
    );
};

export default LazySeatingMapEditor;
//ad