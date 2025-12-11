import React from 'react';

const SalasList = ({ salas }) => {

    return <p>No hay salas disponibles</p>;
  }

  return (
    <ul>
      {salas.map((sala) => (
        <li key={sala.id}>{sala.nombre}</li>
      ))}
    </ul>
  );
};

export default SalasList;
