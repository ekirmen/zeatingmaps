import React from 'react';
import LoadOnVisible from './LoadOnVisible';

const SeatLayer = (props) => {
  return <LoadOnVisible loader={() => import('./SeatLayerCore.jsx')} loaderProps={props} />;
};

export default SeatLayer;
