import React from 'react';
import { Button } from '../utils/antdComponents';

const Funciones = ({ funciones = [], onModificar, onEliminar }) => (
  <div className="space-y-4">
    {funciones.map((funcion) => (
      <div key={funcion._id} className="p-4 border rounded shadow-sm flex justify-between items-center">
        <div>
          <h3 className="font-semibold">{funcion.nombre}</h3>
          {funcion.fecha && <p className="text-sm text-gray-600">{funcion.fecha}</p>}
        </div>
        <div className="space-x-2">
          <Button type="primary" size="small" onClick={() => onModificar?.(funcion)}>Modificar</Button>
          <Button danger size="small" onClick={() => onEliminar?.(funcion)}>Eliminar</Button>
        </div>
      </div>
    ))}
  </div>
);

export default Funciones;

