import React from 'react';
import LoadOnVisible from './LoadOnVisible';


  return <LoadOnVisible loader={() => import('./SeatWithTooltipCore.jsx')} loaderProps={props} />;
}
