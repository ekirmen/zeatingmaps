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
          value={recintoSeleccionado ? recintoSeleccionado.id : ''}
          onChange={handleRecintoChange}
        >
          <option value="" disabled>
            Seleccione un recinto
          </option>
          {recintos.map((recinto) => (
            <option key={recinto.id} value={recinto.id}>
              {recinto.nombre}
            </option>
          ))}
        </select>
      </div>

      {recintoSeleccionado && (
        <div className="sala-select">
          <select
            value={salaSeleccionada ? salaSeleccionada.id : ''}
            onChange={(e) =>
              setSalaSeleccionada(
                recintoSeleccionado.salas.find(
                  (sala) => String(sala.id) === e.target.value
                )
              )
            }
          >
            <option value="" disabled>
              Seleccione una sala
            </option>
            {recintoSeleccionado.salas.map((sala) => (
              <option key={sala.id} value={sala.id}>
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