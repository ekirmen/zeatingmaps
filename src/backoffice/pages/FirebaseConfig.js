import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const FirebaseConfig = () => {
  const [useFirebase, setUseFirebase] = useState(false);
  const [authDomain, setAuthDomain] = useState('');
  const [dbUrl, setDbUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [expiration, setExpiration] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'firebase-use',
          'firebase-auth-domain',
          'firebase-db-url',
          'firebase-api-key',
          'cart-seat-expiration',
        ]);
      if (!error && data) {
        data.forEach((row) => {
          switch (row.key) {
            case 'firebase-use':
              setUseFirebase(row.value === 'true');
              break;
            case 'firebase-auth-domain':
              setAuthDomain(row.value);
              break;
            case 'firebase-db-url':
              setDbUrl(row.value);
              break;
            case 'firebase-api-key':
              setApiKey(row.value);
              break;
            case 'cart-seat-expiration':
              setExpiration(row.value);
              break;
            default:
              break;
          }
        });
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    const entries = [
      { key: 'firebase-use', value: String(useFirebase) },
      { key: 'firebase-auth-domain', value: authDomain },
      { key: 'firebase-db-url', value: dbUrl },
      { key: 'firebase-api-key', value: apiKey },
      { key: 'cart-seat-expiration', value: expiration },
    ];
    const { error } = await supabase.from('settings').upsert(entries, { onConflict: ['key'] });
    if (error) {
      console.error('Error al guardar la configuración de Firebase:', error);
      alert('Error al guardar la configuración');
    } else {
      alert('Configuración guardada correctamente');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Firebase configuración</h2>
      <label className="block text-sm font-medium mb-1">Use Firebase integration</label>
      <input
        type="checkbox"
        className="mb-4"
        checked={useFirebase}
        onChange={(e) => setUseFirebase(e.target.checked)}
      />

      <label className="block text-sm font-medium mb-1">Authentication domain</label>
      <input
        type="text"
        className="border p-2 w-full rounded border-gray-300"
        placeholder="yourapp.firebaseapp.com"
        value={authDomain}
        onChange={(e) => setAuthDomain(e.target.value)}
      />

      <label className="block text-sm font-medium mb-1 mt-4">Database URL</label>
      <input
        type="text"
        className="border p-2 w-full rounded border-gray-300"
        placeholder="yourapp.firebaseio.com"
        value={dbUrl}
        onChange={(e) => setDbUrl(e.target.value)}
      />

      <label className="block text-sm font-medium mb-1 mt-4">API Key</label>
      <input
        type="text"
        className="border p-2 w-full rounded border-gray-300"
        placeholder="your API key here"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />

      <label className="block text-sm font-medium mb-1 mt-4">Other cart seat expiration (minutos)</label>
      <input
        type="number"
        className="border p-2 w-full rounded border-gray-300"
        placeholder="5 minutes"
        value={expiration}
        onChange={(e) => setExpiration(e.target.value)}
      />

      <div className="mt-6 text-right">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
          onClick={handleSave}
        >
          Guardar
        </button>
      </div>

      <pre className="bg-gray-100 p-4 mt-6 overflow-auto text-xs">
{`{
   "rules": {
         "reserved": {
           "$chart_id": {
                   ".indexOn": "timestamp"
           }
       },
       "in-cart": {
           "$chart_id": {
               "$seat": {
                   ".indexOn": "timestamp"
               }
           }
       },
       ".read": true,
       ".write": true
   }
}`}
      </pre>
    </div>
  );
};

export default FirebaseConfig;
