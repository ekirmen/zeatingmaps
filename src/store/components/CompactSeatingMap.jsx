import React from 'react';
import LoadOnVisible from '../../components/LoadOnVisible';

const CompactSeatingMap = (props) => (
  <LoadOnVisible
    loader={() => import('./CompactSeatingMapCore.jsx')}
    fallback={<div style={{ minHeight: 300 }}>Cargando mapa compacto...</div>}
    loaderProps={props}
  />
);

export default CompactSeatingMap;
