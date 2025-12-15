import React from 'react';
import LoadOnVisible from './LoadOnVisible';

const MesaSilla = (props) => {
  return <LoadOnVisible loader={() => import('./MesaSillaCore.jsx')} loaderProps={props} />;
};

export default MesaSilla;
