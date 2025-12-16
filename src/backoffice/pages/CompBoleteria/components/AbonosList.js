import React from 'react';


const AbonosList = ({ abonos = [] }) => {
  if (abonos.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="font-semibold mb-2">Abonos disponibles</h4>
      <ul className="list-disc list-inside text-sm space-y-1">
        {abonos.map((a) => (
          <li key={a.id || a._id}>{a.packageType || a.tipo}</li>
        ))}
      </ul>
    </div>
  );
};

export default AbonosList; 
