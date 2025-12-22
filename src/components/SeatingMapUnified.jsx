import React from 'react';
import LoadOnVisible from './LoadOnVisible';

export default function SeatingMapUnified(props) {
  return <LoadOnVisible loader={() => import('./SeatingMapViewer.jsx')} loaderProps={props} />;
}
