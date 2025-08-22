import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';

const RecintoSalaContext = createContext();

export const RecintoSalaProvider = ({ children }) => {
  const { currentTenant } = useTenant();
  const [recintos, setRecintos] = useState([]);
  const [recinto, setRecinto] = useState(() => {
    const stored = localStorage.getItem('recinto');
    return stored ? JSON.parse(stored) : null;
  });
  const [salas, setSalas] = useState([]);
  const [sala, setSala] = useState(() => {
    const stored = localStorage.getItem('sala');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const fetchRecintos = async () => {
      try {
        console.log('🔍 [RecintoSalaContext] Obteniendo recintos para tenant:', currentTenant?.id);
        
        let query = supabase.from('recintos').select('*, salas(*)');
        
        // Filtrar por tenant_id si está disponible
        if (currentTenant?.id) {
          query = query.eq('tenant_id', currentTenant.id);
          console.log('✅ [RecintoSalaContext] Filtrando por tenant_id:', currentTenant.id);
        } else {
          console.warn('⚠️ [RecintoSalaContext] No hay tenant disponible, consultando sin filtro');
        }
        
        const { data, error } = await query;
        if (error) {
          console.error('❌ [RecintoSalaContext] Error fetching recintos:', error.message);
          setRecintos([]);
        } else {
          console.log('✅ [RecintoSalaContext] Recintos obtenidos:', data?.length || 0);
          setRecintos(data || []);
        }
      } catch (error) {
        console.error('❌ [RecintoSalaContext] Error inesperado:', error.message);
        setRecintos([]);
      }
    };

    // Solo ejecutar si tenemos un tenant o si estamos en desarrollo
    if (currentTenant?.id || window.location.hostname === 'localhost' || window.location.hostname.includes('vercel.app')) {
      fetchRecintos();
    } else if (!currentTenant && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('vercel.app')) {
      console.log('⏳ [RecintoSalaContext] Esperando tenant...');
    }
  }, [currentTenant]);

  useEffect(() => {
    if (recinto) {
      localStorage.setItem('recinto', JSON.stringify(recinto));
      // actualizar las salas del recinto seleccionado
      setSalas(recinto.salas || []);
    } else {
      localStorage.removeItem('recinto');
      setSalas([]);
    }
  }, [recinto]);

  useEffect(() => {
    if (sala) {
      localStorage.setItem('sala', JSON.stringify(sala));
    } else {
      localStorage.removeItem('sala');
    }
  }, [sala]);

  return (
    <RecintoSalaContext.Provider
      value={{
        recintos,
        setRecintos,
        recinto,
        setRecinto,
        salas,
        setSalas,
        sala,
        setSala,
      }}
    >
      {children}
    </RecintoSalaContext.Provider>
  );
};

export const useRecintoSala = () => {
  const context = useContext(RecintoSalaContext);
  if (!context) {
    throw new Error('useRecintoSala debe ser usado dentro de RecintoSalaProvider');
  }
  return context;
};
