import React from 'react';
import LoadOnVisible from '../LoadOnVisible';

export default function Grid(props) {
  return <LoadOnVisible loader={() => import('./GridCore.js')} loaderProps={props} />;
}
