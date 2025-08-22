import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';

const RecintoContext = createContext();

export const RecintoProvider = ({ children }) => {
  const { currentTenant } = useTenant();
  const [recintos, setRecintos] = useState([]);
  const [recintoSeleccionado, setRecintoSeleccionado] = useState(() => {
    const stored = localStorage.getItem('recintoSeleccionado');
    return stored ? JSON.parse(stored) : null;
  });
  const [salaSeleccionada, setSalaSeleccionada] = useState(() => {
    const stored = localStorage.getItem('salaSeleccionada');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const fetchRecintos = async () => {
      try {
        console.log('🔍 [RecintoContext] Obteniendo recintos para tenant:', currentTenant?.id);
        console.log('🔍 [RecintoContext] Hostname:', window.location.hostname);
        
        let query = supabase
          .from('recintos')
          .select('*, salas(*)');
        
        // Filtrar por tenant_id si está disponible
        if (currentTenant?.id) {
          query = query.eq('tenant_id', currentTenant.id);
          console.log('✅ [RecintoContext] Filtrando por tenant_id:', currentTenant.id);
        } else {
          console.warn('⚠️ [RecintoContext] No hay tenant disponible, consultando sin filtro');
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ [RecintoContext] Error en query:', error);
          throw error;
        }

        console.log('✅ [RecintoContext] Recintos obtenidos:', data?.length || 0);
        console.log('✅ [RecintoContext] Primer recinto:', data?.[0]);
        setRecintos(data || []);
      } catch (error) {
        console.error('❌ [RecintoContext] Error al obtener recintos:', error.message);
        setRecintos([]);
      }
    };

    // Solo ejecutar si tenemos un tenant o si estamos en desarrollo
    if (currentTenant?.id || window.location.hostname === 'localhost' || window.location.hostname.includes('vercel.app')) {
      console.log('🚀 [RecintoContext] Ejecutando fetchRecintos');
      fetchRecintos();
    } else if (!currentTenant && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('vercel.app')) {
      console.log('⏳ [RecintoContext] Esperando tenant...');
    }
  }, [currentTenant]);

  useEffect(() => {
    if (recintoSeleccionado) {
      localStorage.setItem('recintoSeleccionado', JSON.stringify(recintoSeleccionado));
    } else {
      localStorage.removeItem('recintoSeleccionado');
    }
  }, [recintoSeleccionado]);

  useEffect(() => {
    if (salaSeleccionada) {
      localStorage.setItem('salaSeleccionada', JSON.stringify(salaSeleccionada));
    } else {
      localStorage.removeItem('salaSeleccionada');
    }
  }, [salaSeleccionada]);

  return (
    <RecintoContext.Provider
      value={{
        recintos,
        setRecintos,
        recintoSeleccionado,
        setRecintoSeleccionado,
        salaSeleccionada,
        setSalaSeleccionada,
      }}
    >
      {children}
    </RecintoContext.Provider>
  );
};

export const useRecinto = () => {
  const context = useContext(RecintoContext);
  if (!context) {
    throw new Error('useRecinto must be used within a RecintoProvider');
  }
  return context;
};
