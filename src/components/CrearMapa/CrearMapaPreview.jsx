import React from 'react';
import LoadOnVisible from '../LoadOnVisible';

export default function CrearMapaPreview(props) {
  return <LoadOnVisible loader={() => import('./CrearMapaPreviewCore.jsx')} loaderProps={props} />;
}
