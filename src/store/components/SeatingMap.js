import React from 'react';
import LoadOnVisible from '../../components/LoadOnVisible';

export default function SeatingMap(props) {
  return <LoadOnVisible loader={() => import('./SeatingMapCore.jsx')} loaderProps={props} />;
}

