import React from 'react';
import LoadOnVisible from '../../components/LoadOnVisible';

const SelectSeatsCanvas = (props) => {
  return <LoadOnVisible loader={() => import('./SelectSeatsCanvasCore.jsx')} loaderProps={props} />;
};

export default SelectSeatsCanvas;
