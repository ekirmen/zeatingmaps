import React from 'react';
import LoadOnVisible from './LoadOnVisible';

const TableLayer = (props) => {
  return <LoadOnVisible loader={() => import('./TableLayerCore.jsx')} loaderProps={props} />;
};

export default TableLayer;
