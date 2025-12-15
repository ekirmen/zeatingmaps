import React, { useState } from 'react';
import SalasList from './SalasList';

const RecintoItem = ({ recinto, onEdit, onAddSala }) => {
  const [showSalas, setShowSalas] = useState(false);

  const toggleSalas = () => {
    setShowSalas(!showSalas);
  };

  return (
    <li>
      <h2>{recinto.nombre}</h2>
      <p>{recinto.direccion}</p>
      <p>Capacidad: {recinto.capacidad}</p>

      <button onClick={() => onEdit(recinto)}>Editar Recinto</button>
      <button onClick={() => onAddSala(recinto)}>Agregar Sala</button>

      {/* Botón para mostrar/ocultar el menú de salas */}
      <button onClick={toggleSalas}>{showSalas ? 'Ocultar Salas' : 'Mostrar Salas'}</button>

      {/* Menú desplegable de salas */}
      {showSalas && (
        <div className="sala-menu">
          <h3>Salas:</h3>
          <SalasList salas={recinto.salas} />
        </div>
      )}
    </li>
  );
};

export default RecintoItem;
