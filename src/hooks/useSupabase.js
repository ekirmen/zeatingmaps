import { useState, useEffect } from 'react';
import { getSupabaseClient, getSupabaseAdminClient } from '../config/supabase';

export const useSupabase = () => {
  const [supabase, setSupabase] = useState(null);
  const [supabaseAdmin, setSupabaseAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Obtener clientes
        const client = getSupabaseClient();
        const adminClient = getSupabaseAdminClient();

        if (!client) {
          throw new Error('No se pudo inicializar el cliente de Supabase');
        }

        setSupabase(client);
        setSupabaseAdmin(adminClient);
      } catch (err) {
        console.error('[useSupabase] Error al inicializar Supabase:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSupabase();
  }, []);

  return {
    supabase,
    supabaseAdmin,
    isLoading,
    error,
    isReady: !isLoading && !error && supabase !== null
  };
}; 