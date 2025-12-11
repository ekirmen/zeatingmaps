import React from "react";


  return (
    <div className="sala-selector">
      <select value={salaSeleccionada} onChange={e => onChange(e.target.value)}>
        <option value="">Selecciona una sala</option>
        {salas.map(s => (
          <option key={s.id} value={s.id}>{s.nombre}</option>
        ))}
      </select>
    </div>
  );
};

export default SalaSelector;
