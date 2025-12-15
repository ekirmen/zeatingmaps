import React from 'react';
import LoadOnVisible from './LoadOnVisible';

const CrearMapaPreview = (props) => {
  return <LoadOnVisible loader={() => import('./CrearMapaPreviewCore.jsx')} loaderProps={props} />;
};

export default CrearMapaPreview;
