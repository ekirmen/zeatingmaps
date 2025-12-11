import React from 'react';
import LoadOnVisible from './LoadOnVisible';


  return <LoadOnVisible loader={() => import('./ChairCore.jsx')} loaderProps={props} />;
}
