import React from 'react';
import LoadOnVisible from './LoadOnVisible';

const Table = (props) => {
  return <LoadOnVisible loader={() => import('./TableCore.jsx')} loaderProps={props} />;
};

export default Table;
