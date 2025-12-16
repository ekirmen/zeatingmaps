import React from 'react';
import LoadOnVisible from '../../components/LoadOnVisible';



const SeatingMap = (props) => {
  return <LoadOnVisible loader={() => import('./SeatingMapCore.jsx')} loaderProps={props} />;
}




export default SeatingMap;