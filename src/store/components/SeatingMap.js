import React from 'react';
import LoadOnVisible from '../../components/LoadOnVisible';


  return <LoadOnVisible loader={() => import('./SeatingMapCore.jsx')} loaderProps={props} />;
}

