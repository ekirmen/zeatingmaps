import React from 'react';
import LoadOnVisible from '../../components/LoadOnVisible';

export default function SelectSeatsCanvas(props) {
  return <LoadOnVisible loader={() => import('./SelectSeatsCanvasCore.jsx')} loaderProps={props} />;
}
