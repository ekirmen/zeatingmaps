import React from 'react';

const SelectRecintoSala = ({ recintos, salas, recinto, setRecinto, sala, setSala }) => (
  <div>
    <select
      value={recinto ? recinto._id : ''}
      onChange={(e) => {
        const recintoSeleccionado = recintos.find((r) => r._id === e.target.value);
        setRecinto(recintoSeleccionado);
        setSala(null);
      }}
    >
      <option value="" disabled>Seleccionar Recinto</option>
      {recintos.map((item) => (
        <option key={item._id} value={item._id}>
          {item.nombre}
        </option>
      ))}
    </select>
    {salas.length > 0 && (
      <select
        value={sala ? sala._id : ''}
        onChange={(e) => {
          const salaSeleccionada = salas.find((s) => s._id === e.target.value);
          setSala(salaSeleccionada);
        }}
      >
        <option value="" disabled>Seleccionar Sala</option>
        {salas.map((salaItem) => (
          <option key={salaItem._id} value={salaItem._id}>
            {salaItem.nombre}
          </option>
        ))}
      </select>
    )}
  </div>
);

export default SelectRecintoSala;
