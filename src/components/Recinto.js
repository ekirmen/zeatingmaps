import React from 'react';
import { Button } from '../utils/antdComponents';

const Recinto = ({ recintos = [], onActualizar, onEliminar }) => (
  <div className="space-y-4">
    {recintos.map((recinto) => (
      <div key={recinto._id} className="p-4 border rounded shadow-sm flex justify-between items-center">
        <div>
          <h3 className="font-semibold">{recinto.nombre}</h3>
          {recinto.direccion && <p className="text-sm text-gray-600">{recinto.direccion}</p>}
        </div>
        <div className="space-x-2">
          <Button type="primary" size="small" onClick={() => onActualizar?.(recinto)}>Actualizar</Button>
          <Button danger size="small" onClick={() => onEliminar?.(recinto)}>Eliminar</Button>
        </div>
      </div>
    ))}
  </div>
);

export default Recinto;

