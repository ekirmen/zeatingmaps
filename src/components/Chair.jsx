import React from 'react';
import LoadOnVisible from './LoadOnVisible';

export default function Chair(props) {
  return <LoadOnVisible loader={() => import('./ChairCore.jsx')} loaderProps={props} />;
}
