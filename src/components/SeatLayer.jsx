import React from 'react';
import LoadOnVisible from './LoadOnVisible';


  return <LoadOnVisible loader={() => import('./SeatLayerCore.jsx')} loaderProps={props} />;
}
