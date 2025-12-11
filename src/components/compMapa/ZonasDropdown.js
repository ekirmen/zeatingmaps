import React from 'react';


  return (
    <div className="space-y-2">
      <select 
        value={selectedZoneId || ''} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md text-sm"
      >
        <option value=''>Seleccionar zona</option>
        {zonas.map((zona) => (
          <option key={zona.id} value={zona.id}>
            {zona.nombre} ({zoneSeatCounts[zona.id] || 0} asientos)
          </option>
        ))}
      </select>
      
      {/* Información sobre tipos de zona */}
      <div className="text-xs text-gray-600 space-y-1">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Zona numerada: se vende por asiento individual</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Zona no numerada: se vende por cantidad total</span>
        </div>
      </div>
    </div>
  );
};

export default ZonasDropdown;
