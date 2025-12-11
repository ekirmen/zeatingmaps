import React from 'react';
import LoadOnVisible from '../LoadOnVisible';


  return <LoadOnVisible loader={() => import('./MesaSillaCore.jsx')} loaderProps={props} />;
}
