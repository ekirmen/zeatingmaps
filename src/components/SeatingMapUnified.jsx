import React from 'react';
import LoadOnVisible from './LoadOnVisible';


  return <LoadOnVisible loader={() => import('./SeatingMapUnifiedCore.jsx')} loaderProps={props} />;
}
