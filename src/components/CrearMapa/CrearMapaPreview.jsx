import React from 'react';
import LoadOnVisible from '../LoadOnVisible';


  return <LoadOnVisible loader={() => import('./CrearMapaPreviewCore.jsx')} loaderProps={props} />;
}
