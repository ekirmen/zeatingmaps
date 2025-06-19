import React from "react";

const RecintoSelector = ({ recintos, recintoSeleccionado, onChange }) => {
  return (
    <div className="recinto-selector">
      <select value={recintoSeleccionado} onChange={e => onChange(e.target.value)}>
        <option value="">Selecciona un recinto</option>
        {recintos.map(r => (
          <option key={r.id} value={r.id}>{r.nombre}</option>
        ))}
      </select>
    </div>
  );
};

export default RecintoSelector;
