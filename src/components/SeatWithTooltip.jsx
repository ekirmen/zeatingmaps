import React from 'react';
import LoadOnVisible from './LoadOnVisible';

const SeatWithTooltip = (props) => {
  return <LoadOnVisible loader={() => import('./SeatWithTooltipCore.jsx')} loaderProps={props} />;
};

export default SeatWithTooltip;
