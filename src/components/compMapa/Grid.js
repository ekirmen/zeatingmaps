import React from 'react';
import LoadOnVisible from '../LoadOnVisible';


  return <LoadOnVisible loader={() => import('./GridCore.js')} loaderProps={props} />;
}
