import React from 'react';
import LoadOnVisible from './LoadOnVisible';

export default function TableLayer(props) {
  return <LoadOnVisible loader={() => import('./TableLayerCore.jsx')} loaderProps={props} />;
}
