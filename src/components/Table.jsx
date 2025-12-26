import React from 'react';
import LoadOnVisible from './LoadOnVisible';

export default function Table(props) {
  return <LoadOnVisible loader={() => import('./TableCore.jsx')} loaderProps={props} />;
}
