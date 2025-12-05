import React from 'react';
import LoadOnVisible from './LoadOnVisible';

export default function BackgroundLayer(props) {
  return <LoadOnVisible loader={() => import('./BackgroundLayerCore.jsx')} loaderProps={props} />;
}
