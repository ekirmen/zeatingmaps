import React from 'react';
import LoadOnVisible from './LoadOnVisible';

const SeatingMapUnified = (props) => {
  return <LoadOnVisible loader={() => import('./SeatingMapUnifiedCore.jsx')} loaderProps={props} />;
};

export default SeatingMapUnified;
