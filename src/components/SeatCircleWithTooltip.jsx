import React from 'react';
import LoadOnVisible from './LoadOnVisible';

const SeatCircleWithTooltip = (props) => {
  return <LoadOnVisible loader={() => import('./SeatCircleWithTooltipCore.jsx')} loaderProps={props} />;
};

export default SeatCircleWithTooltip;

