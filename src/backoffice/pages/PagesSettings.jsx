import React, { useEffect, useState } from 'react';

const PagesSettings = () => {
  const [debugStore, setDebugStore] = useState(false);
  const [debugBackoffice, setDebugBackoffice] = useState(false);
  const [debugRealtime, setDebugRealtime] = useState(false);

  useEffect(() => {
    setDebugStore(localStorage.getItem('debug_store') === '1');
    setDebugBackoffice(localStorage.getItem('debug_backoffice') === '1');
    setDebugRealtime(localStorage.getItem('debug_realtime') === '1');
  }, []);

  const saveSettings = () => {
    localStorage.setItem('debug_store', debugStore ? '1' : '0');
    localStorage.setItem('debug_backoffice', debugBackoffice ? '1' : '0');
    localStorage.setItem('debug_realtime', debugRealtime ? '1' : '0');
    alert('Configuración de debug guardada.');
  };

  const clearLocalCache = () => {
    const keepKeys = ['debug_store', 'debug_backoffice', 'debug_realtime'];
    Object.keys(localStorage).forEach((k) => {
      if (!keepKeys.includes(k)) localStorage.removeItem(k);
    });
    alert('Cache local limpiado (excepto configuración de debug)');
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Configuración del Store</h1>



      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Depuración</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={debugStore} onChange={(e) => setDebugStore(e.target.checked)} />
            Activar debug en Store
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={debugBackoffice} onChange={(e) => setDebugBackoffice(e.target.checked)} />
            Activar debug en Backoffice
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={debugRealtime} onChange={(e) => setDebugRealtime(e.target.checked)} />
            Activar debug de Realtime
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={saveSettings} className="bg-blue-600 text-white px-4 py-2 rounded">Guardar</button>
        <button onClick={clearLocalCache} className="bg-gray-100 px-4 py-2 rounded">Limpiar cache local</button>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p className="font-semibold mb-1">Nota:</p>
        <p>La configuración de tiempos de expiración de asientos ahora se encuentra en:</p>
        <p className="font-semibold text-blue-600">Personalización → Configuración de Asientos</p>
      </div>
    </div>
  );
};

export default PagesSettings;


