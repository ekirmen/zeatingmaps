import React from 'react';
import LoadOnVisible from './LoadOnVisible';

const MapElementsLayer = (props) => {
  return <LoadOnVisible loader={() => import('./MapElementsLayerCore.jsx')} loaderProps={props} />;
};

export default MapElementsLayer;
