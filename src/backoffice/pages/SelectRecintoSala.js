import React from 'react';

const SelectRecintoSala = ({ recintos, salas, recinto, setRecinto, sala, setSala }) => (
  <div>
    <select
      value={recinto ? recinto.id : ''}
      onChange={(e) => {
        const recintoSeleccionado = recintos.find((r) => String(r.id) === e.target.value);
        setRecinto(recintoSeleccionado);
        setSala(null);
      }}
    >
      <option value="" disabled>Seleccionar Recinto</option>
      {recintos.map((item) => (
        <option key={item.id} value={item.id}>
          {item.nombre}
        </option>
      ))}
    </select>
    {salas.length > 0 && (
      <select
        value={sala ? sala.id : ''}
        onChange={(e) => {
          const salaSeleccionada = salas.find((s) => String(s.id) === e.target.value);
          setSala(salaSeleccionada);
        }}
      >
        <option value="" disabled>Seleccionar Sala</option>
        {salas.map((salaItem) => (
          <option key={salaItem.id} value={salaItem.id}>
            {salaItem.nombre}
          </option>
        ))}
      </select>
    )}
  </div>
);

export default SelectRecintoSala;
