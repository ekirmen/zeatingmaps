import React from 'react';
import LoadOnVisible from './LoadOnVisible';

const Chair = (props) => {
  return <LoadOnVisible loader={() => import('./ChairCore.jsx')} loaderProps={props} />;
};

export default Chair;
