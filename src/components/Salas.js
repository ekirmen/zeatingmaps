import React from 'react';
import { Button } from '../utils/antdComponents';

const Salas = ({ salas = [], onModificar, onEliminar }) => (
  <div className="space-y-4">
    {salas.map(sala => (
      <div
        key={sala._id}
        className="p-4 border rounded shadow-sm flex justify-between items-center"
      >
        <span>{sala.nombre}</span>
        <div className="space-x-2">
          <Button type="primary" size="small" onClick={() => onModificar?.(sala)}>
            Modificar
          </Button>
          <Button danger size="small" onClick={() => onEliminar?.(sala)}>
            Eliminar
          </Button>
        </div>
      </div>
    ))}
  </div>
);

export default Salas;
