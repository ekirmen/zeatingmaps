import React from 'react';
import LoadOnVisible from './LoadOnVisible';


  return <LoadOnVisible loader={() => import('./TableCore.jsx')} loaderProps={props} />;
}
