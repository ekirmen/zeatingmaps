import React from 'react';
import LoadOnVisible from './LoadOnVisible';

const SeatingMap = (props) => (
  <LoadOnVisible
    loader={() => import('./SeatingMapCore.jsx')}
    fallback={<div style={{ minHeight: 600 }}>Cargando mapa...</div>}
    loaderProps={props}
  />
);

export default SeatingMap;
