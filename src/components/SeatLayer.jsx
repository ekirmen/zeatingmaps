import React from 'react';
import LoadOnVisible from './LoadOnVisible';

export default function SeatLayer(props) {
  return <LoadOnVisible loader={() => import('./SeatLayerCore.jsx')} loaderProps={props} />;
}
