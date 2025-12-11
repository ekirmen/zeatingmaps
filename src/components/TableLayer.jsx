import React from 'react';
import LoadOnVisible from './LoadOnVisible';


  return <LoadOnVisible loader={() => import('./TableLayerCore.jsx')} loaderProps={props} />;
}
