// src/components/RecintoList.js
import React from 'react';

const RecintoList = ({ recintos, onEdit, onAddSala }) => {
  return (
    <div>
      {recintos.map((recinto) => (
        <div key={recinto._id} style={{ marginBottom: '20px', border: '1px solid #ddd', padding: '10px' }}>
          <h3>{recinto.nombre}</h3>
          <p>Dirección: {recinto.direccion}</p>
          <p>Capacidad: {recinto.capacidad}</p>

          <h4>Salas:</h4>
          {recinto.salas && Array.isArray(recinto.salas) && recinto.salas.length > 0 ? (
            <ul>
              {recinto.salas.map((sala) => (
                <li key={sala._id}>{sala.nombre}</li>
              ))}
            </ul>
          ) : (
            <p>No hay salas disponibles</p>
          )}

          <button onClick={() => onEdit(recinto)}>Editar Recinto</button>
          <button onClick={() => onAddSala(recinto)}>Añadir Sala</button>
        </div>
      ))}
    </div>
  );
};

export default RecintoList;
