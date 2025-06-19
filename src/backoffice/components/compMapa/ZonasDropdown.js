import React from 'react';

const ZonasDropdown = ({ zonas, zoneSeatCounts = {}, selectedZoneId, onChange }) => {
  return (
    <select value={selectedZoneId || ''} onChange={(e) => onChange(e.target.value)}>
      <option value=''>Seleccionar zona</option>
      {zonas.map((zona) => (
        <option key={zona.id} value={zona.id}>
          {zona.nombre} ({zoneSeatCounts[zona.id] || 0})
        </option>
      ))}
    </select>
  );
};


export default ZonasDropdown;
