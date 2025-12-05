import React from 'react';
import LoadOnVisible from './LoadOnVisible';

export default function SeatWithTooltip(props) {
  return <LoadOnVisible loader={() => import('./SeatWithTooltipCore.jsx')} loaderProps={props} />;
}
