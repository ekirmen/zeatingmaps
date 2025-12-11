import React from 'react';
import LoadOnVisible from './LoadOnVisible';


  return <LoadOnVisible loader={() => import('./BackgroundLayerCore.jsx')} loaderProps={props} />;
}
