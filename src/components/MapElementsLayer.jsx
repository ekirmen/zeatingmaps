import React from 'react';
import LoadOnVisible from './LoadOnVisible';

export default function MapElementsLayer(props) {
  return <LoadOnVisible loader={() => import('./MapElementsLayerCore.jsx')} loaderProps={props} />;
}
