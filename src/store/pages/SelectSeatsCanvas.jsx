import React from 'react';
import LoadOnVisible from '../../components/LoadOnVisible';


  return <LoadOnVisible loader={() => import('./SelectSeatsCanvasCore.jsx')} loaderProps={props} />;
}
