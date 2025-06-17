import React from 'react';

const VenueSelectors = ({ 
  recintos, 
  recintoSeleccionado, 
  handleRecintoChange,
  salaSeleccionada,
  setSalaSeleccionada
}) => {
  return (
    <>
      <div className="recinto-select">
        <select
          id="recintoSelect"
          value={recintoSeleccionado ? recintoSeleccionado._id : ''}
          onChange={handleRecintoChange}
        >
          <option value="" disabled>
            Seleccione un recinto
          </option>
          {recintos.map((recinto) => (
            <option key={recinto._id} value={recinto._id}>
              {recinto.nombre}
            </option>
          ))}
        </select>
      </div>

      {recintoSeleccionado && (
        <div className="sala-select">
          <select
            value={salaSeleccionada ? salaSeleccionada._id : ''}
            onChange={(e) =>
              setSalaSeleccionada(
                recintoSeleccionado.salas.find((sala) => sala._id === e.target.value)
              )
            }
          >
            <option value="" disabled>
              Seleccione una sala
            </option>
            {recintoSeleccionado.salas.map((sala) => (
              <option key={sala._id} value={sala._id}>
                {sala.nombre}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
};

export default VenueSelectors;