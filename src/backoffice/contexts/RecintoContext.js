import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';
import logger from '../../utils/logger';

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

  const prevTenantId = useRef(null);
  
  useEffect(() => {
    const tenantId = currentTenant?.id;
    
    // Solo cargar si cambió el tenant o si no se ha cargado antes
    if (tenantId === prevTenantId.current && recintos.length > 0) return;
    if (!tenantId && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('vercel.app')) {
      logger.log('⏳ [RecintoContext] Esperando tenant...');
      return;
    }
    
    prevTenantId.current = tenantId;
    
    const fetchRecintos = async () => {
      try {
        logger.log('🔍 [RecintoContext] Obteniendo recintos para tenant:', tenantId);
        
        let query = supabase
          .from('recintos')
          .select('*, salas(*)');
        
        // Filtrar por tenant_id si está disponible
        if (tenantId) {
          query = query.eq('tenant_id', tenantId);
          logger.log('✅ [RecintoContext] Filtrando por tenant_id:', tenantId);
        } else {
          logger.warn('⚠️ [RecintoContext] No hay tenant disponible, consultando sin filtro');
        }

        const { data, error } = await query;

        if (error) {
          logger.error('❌ [RecintoContext] Error en query:', error);
          throw error;
        }

        logger.log('✅ [RecintoContext] Recintos obtenidos:', data?.length || 0);
        setRecintos(data || []);
      } catch (error) {
        logger.error('❌ [RecintoContext] Error al obtener recintos:', error.message);
        setRecintos([]);
      }
    };

    // Solo ejecutar si tenemos un tenant o si estamos en desarrollo
    if (tenantId || window.location.hostname === 'localhost' || window.location.hostname.includes('vercel.app')) {
      logger.log('🚀 [RecintoContext] Ejecutando fetchRecintos');
      fetchRecintos();
    }
  }, [currentTenant?.id, recintos.length]);

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
