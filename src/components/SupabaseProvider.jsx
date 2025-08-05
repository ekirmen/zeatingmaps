import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient, getSupabaseAdminClient } from '../config/supabase';

const SupabaseContext = createContext();

export const useSupabaseContext = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabaseContext debe usarse dentro de SupabaseProvider');
  }
  return context;
};

export const SupabaseProvider = ({ children }) => {
  const [supabase, setSupabase] = useState(null);
  const [supabaseAdmin, setSupabaseAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('[SUPABASE PROVIDER] Inicializando Supabase...');

        // Obtener clientes
        const client = getSupabaseClient();
        const adminClient = getSupabaseAdminClient();

        if (!client) {
          throw new Error('No se pudo inicializar el cliente de Supabase');
        }

        setSupabase(client);
        setSupabaseAdmin(adminClient);

        console.log('[SUPABASE PROVIDER] Supabase inicializado correctamente');
      } catch (err) {
        console.error('[SUPABASE PROVIDER] Error al inicializar Supabase:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSupabase();
  }, []);

  const value = {
    supabase,
    supabaseAdmin,
    isLoading,
    error,
    isReady: !isLoading && !error && supabase !== null
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Inicializando aplicación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error de inicialización</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}; 