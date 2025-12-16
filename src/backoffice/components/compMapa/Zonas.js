// Zonas.jsx
import React from 'react';

const Zonas = ({ zones, loadingZonas, selectedZone, onSelect, onAssign }) => {

  if (loadingZonas) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="flex">
      <aside className="w-64 p-4 border-r">
        <h2 className="text-lg font-bold mb-2">Zonas</h2>
        <ul>
          {zones.map((zone) => (
            <li
              key={zone._id}
              onClick={() => onSelect(zone)}
              style={{
                cursor: 'pointer',
                fontWeight: selectedZone?._id === zone._id ? 'bold' : 'normal',
                color: zone.color,
                marginBottom: '0.5rem',
              }}
            >
              {zone.nombre}
            </li>
          ))}
        </ul>
        <button onClick={onAssign} disabled={!selectedZone}>
          Asignar Zona
        </button>
      </aside>

      <main className="flex-1 p-4">
        {/* Aquí puedes incluir el mapa y grid si quieres */}
      </main>
    </div>
  );
};

export default Zonas;
