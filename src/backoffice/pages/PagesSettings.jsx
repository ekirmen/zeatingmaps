import React, { useEffect, useState } from 'react';

const PagesSettings = () => {
  const [cartMinutes, setCartMinutes] = useState(15);
  const [debugStore, setDebugStore] = useState(false);
  const [debugBackoffice, setDebugBackoffice] = useState(false);
  const [debugRealtime, setDebugRealtime] = useState(false);

  useEffect(() => {
    const saved = parseInt(localStorage.getItem('cart_lock_minutes') || '15', 10);
    if (Number.isFinite(saved) && saved > 0) setCartMinutes(saved);
    setDebugStore(localStorage.getItem('debug_store') === '1');
    setDebugBackoffice(localStorage.getItem('debug_backoffice') === '1');
    setDebugRealtime(localStorage.getItem('debug_realtime') === '1');
  }, []);

  const saveSettings = () => {
    const minutes = Math.max(1, Math.min(120, parseInt(cartMinutes || 15, 10)));
    localStorage.setItem('cart_lock_minutes', String(minutes));
    localStorage.setItem('debug_store', debugStore ? '1' : '0');
    localStorage.setItem('debug_backoffice', debugBackoffice ? '1' : '0');
    localStorage.setItem('debug_realtime', debugRealtime ? '1' : '0');
    alert('Configuración guardada. Los cambios del temporizador aplican en el Store al recargar.');
  };

  const clearLocalCache = () => {
    const keepKeys = ['cart_lock_minutes', 'debug_store', 'debug_backoffice', 'debug_realtime'];
    Object.keys(localStorage).forEach((k) => {
      if (!keepKeys.includes(k)) localStorage.removeItem(k);
    });
    alert('Cache local limpiado (excepto configuración)');
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Configuración del Store</h1>

      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Carrito</h2>
        <label className="block text-sm mb-2">Minutos de reserva de asientos</label>
        <input
          type="number"
          min={1}
          max={120}
          value={cartMinutes}
          onChange={(e) => setCartMinutes(e.target.value)}
          className="border p-2 rounded w-32"
        />
        <p className="text-xs text-gray-500 mt-2">Rango permitido: 1 a 120 minutos</p>
      </div>

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
        <p className="font-semibold mb-1">Ideas de mejora futuras:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Persistir configuración por tenant en BD (tabla settings) en vez de localStorage.</li>
          <li>Alternar banners/temas del Store y vista previa en tiempo real.</li>
          <li>Configurar política de liberación automática (gracia de 1-2 min) al expirar.</li>
          <li>Panel para activar/desactivar widgets del Store por página (CMS).</li>
          <li>Log viewer básico para Realtime y pagos fallidos.</li>
        </ul>
      </div>
    </div>
  );
};

export default PagesSettings;


