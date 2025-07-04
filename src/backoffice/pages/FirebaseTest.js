import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const FirebaseTest = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    const payload = {
      operation: 'PUT',
      path: '/test',
      data: {
        mensaje: 'Prueba de conexión desde el frontend',
        timestamp: new Date().toISOString(),
        random: Math.floor(Math.random() * 100000),
        id: crypto.randomUUID(),
      },
    };

    console.log('[FirebaseTest] Invoking firebase-direct', payload);
    setLoading(true);

    const { data, error } = await supabase.functions.invoke('firebase-direct', {
      body: payload,
    });

    setLoading(false);

    if (error) {
      console.error('[FirebaseTest] Error', error);
      setResult({ error: error.message });
    } else {
      console.log('[FirebaseTest] Response', data);
      setResult(data);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Probar conexión Firebase</h2>
      <button
        onClick={handleTest}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
      >
        {loading ? 'Comprobando...' : 'Ejecutar prueba'}
      </button>
      {result && (
        <pre className="bg-gray-100 p-4 mt-4 overflow-auto text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default FirebaseTest;
