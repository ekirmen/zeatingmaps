import React, { useState } from 'react';
import { getDatabaseInstance } from '../../services/firebaseClient';
import { ref, set } from 'firebase/database';

const FirebaseTest = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState('/test');
  const [message, setMessage] = useState('');


  const handleDirectWrite = async () => {
    setLoading(true);
    try {
      const db = await getDatabaseInstance();
      if (!db) {
        setResult({ error: 'Firebase no está configurado' });
        setLoading(false);
        return;
      }
      const normalized = path.startsWith('/') ? path.slice(1) : path;
      const id = crypto.randomUUID();
      await set(ref(db, `${normalized}/${id}`), {
        mensaje: message || 'Prueba de conexión desde el frontend',
        timestamp: new Date().toISOString(),
        random: Math.floor(Math.random() * 100000),
        id,
      });
      setResult({ success: true, method: 'client-sdk' });
    } catch (error) {
      console.error('[FirebaseTest] Firebase direct error', error);
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Probar conexión Firebase</h2>
      <label className="block text-sm font-medium mb-1">Ruta en Firebase</label>
      <input
        type="text"
        className="border p-2 w-full rounded border-gray-300 mb-4"
        value={path}
        onChange={(e) => setPath(e.target.value)}
      />
      <label className="block text-sm font-medium mb-1">Mensaje</label>
      <input
        type="text"
        className="border p-2 w-full rounded border-gray-300 mb-4"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="flex gap-4">
        <button
          onClick={handleDirectWrite}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
      {result && (
        <pre className="bg-gray-100 p-4 mt-4 overflow-auto text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default FirebaseTest;
