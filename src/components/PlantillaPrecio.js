import React from 'react';
import { Button } from '../utils/antdComponents';

const PlantillaPrecio = ({ plantillas = [], onModificar, onEliminar }) => (
  <div className="space-y-4">
    {plantillas.map((plantilla) => (
      <div key={plantilla._id} className="p-4 border rounded shadow-sm flex justify-between items-center">
        <div>
          <h3 className="font-semibold">{plantilla.nombre}</h3>
        </div>
        <div className="space-x-2">
          <Button type="primary" size="small" onClick={() => onModificar?.(plantilla)}>Modificar</Button>
          <Button danger size="small" onClick={() => onEliminar?.(plantilla)}>Eliminar</Button>
        </div>
      </div>
    ))}
  </div>
);

export default PlantillaPrecio;

