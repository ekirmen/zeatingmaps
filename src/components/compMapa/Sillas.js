import React from 'react';
import LoadOnVisible from '../LoadOnVisible';


  return <LoadOnVisible loader={() => import('./SillasCore.jsx')} loaderProps={props} />;
}
