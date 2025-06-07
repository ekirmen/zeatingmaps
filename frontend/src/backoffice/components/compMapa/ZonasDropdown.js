import React from 'react';

const ZonasDropdown = ({ zonas, selectedZoneId, onChange }) => {
  return (
    <select value={selectedZoneId || ''} onChange={(e) => onChange(e.target.value)}>
      <option value=''>Seleccionar zona</option>
      {zonas.map((zona) => (
        <option key={zona._id} value={zona._id}>
          {zona.nombre}
        </option>
      ))}
    </select>
  );
};


export default ZonasDropdown;
