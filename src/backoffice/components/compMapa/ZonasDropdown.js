import React from 'react';

const ZonasDropdown = ({ zonas, zoneSeatCounts = {}, selectedZoneId, onChange }) => {
  return (
    <select value={selectedZoneId || ''} onChange={(e) => onChange(e.target.value)}>
      <option value=''>Seleccionar zona</option>
      {zonas.map((zona) => (
        <option key={zona._id} value={zona._id}>
          {zona.nombre} ({zoneSeatCounts[zona._id] || 0})
        </option>
      ))}
    </select>
  );
};


export default ZonasDropdown;
