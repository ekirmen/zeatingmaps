import React from 'react';
import formatDateString from '../../../../utils/formatDateString';

const FunctionSelector = ({ selectedFuncion, onShowFunctions }) => {
  if (!selectedFuncion) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">
        {formatDateString(selectedFuncion.fechaCelebracion)}
      </span>
      {typeof onShowFunctions === 'function' && (
        <button
          type="button"
          onClick={() => onShowFunctions()}
          className="text-blue-600 underline text-sm"
        >
          Cambiar función
        </button>
      )}
    </div>
  );
};

export default FunctionSelector; 
