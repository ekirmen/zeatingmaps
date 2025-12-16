import React from 'react';
import LoadOnVisible from '../LoadOnVisible';

const AutoWrapped_icmn4m = (props) => {
  return <LoadOnVisible loader={() => import('./GridCore.js')} loaderProps={props} />;
};

export default AutoWrapped_icmn4m;