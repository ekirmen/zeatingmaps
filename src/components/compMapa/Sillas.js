import React from 'react';
import LoadOnVisible from './LoadOnVisible';

const Sillas = (props) => {
  return <LoadOnVisible loader={() => import('./SillasCore.jsx')} loaderProps={props} />;
};

export default Sillas;
