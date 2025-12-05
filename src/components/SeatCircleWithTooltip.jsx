import React from 'react';
import LoadOnVisible from './LoadOnVisible';

export default function SeatCircleWithTooltip(props) {
  return <LoadOnVisible loader={() => import('./SeatCircleWithTooltipCore.jsx')} loaderProps={props} />;
}

