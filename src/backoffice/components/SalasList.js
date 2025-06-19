import React from 'react';

const SalasList = ({ salas }) => {
  if (!salas || salas.length === 0) {
    return <p>No hay salas disponibles</p>;
  }

  return (
    <ul>
      {salas.map((sala) => (
        <li key={sala._id}>{sala.nombre}</li>
      ))}
    </ul>
  );
};

export default SalasList;
