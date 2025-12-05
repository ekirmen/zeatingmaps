import React from 'react';
import LoadOnVisible from '../LoadOnVisible';

export default function MesaSilla(props) {
  return <LoadOnVisible loader={() => import('./MesaSillaCore.jsx')} loaderProps={props} />;
}
