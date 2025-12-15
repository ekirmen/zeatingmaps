import React from 'react';
import LoadOnVisible from './LoadOnVisible';

const BackgroundLayer = (props) => {
  return <LoadOnVisible loader={() => import('./BackgroundLayerCore.jsx')} loaderProps={props} />;
};

export default BackgroundLayer;
