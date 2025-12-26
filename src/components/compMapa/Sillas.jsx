import React from 'react';
import LoadOnVisible from '../LoadOnVisible';

export default function Silla(props) {
  return <LoadOnVisible loader={() => import('./SillasCore.jsx')} loaderProps={props} />;
}
