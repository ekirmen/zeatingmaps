import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';
import logger from '../../utils/logger';


const AutoWrapped_v0bixp = (props) => {
  const RecintoSalaContext = createContext();

  export const RecintoSalaProvider = ({ children }) => {
    const { currentTenant } = useTenant();
    const [recintos, setRecintos] = useState([]);
    const [recinto, setRecinto] = useState(() => {
      return stored ? JSON.parse(stored) : null;
    });
    const [salas, setSalas] = useState([]);
    const [sala, setSala] = useState(() => {
      const stored = localStorage.getItem('sala');
      return stored ? JSON.parse(stored) : null;
    });

    const prevTenantId = useRef(null);

    useEffect(() => {
      const tenantId = currentTenant?.id;

      // Solo cargar si cambió el tenant o si no se ha cargado antes
      if (tenantId === prevTenantId.current && recintos.length > 0) return;
      if (
        !tenantId &&
        !window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('vercel.app')
      ) {
        logger.log('⏳ [RecintoSalaContext] Esperando tenant...');
        return;
      }

      prevTenantId.current = tenantId;

      const fetchRecintos = async () => {
        try {
          logger.log('🔍 [RecintoSalaContext] Obteniendo recintos para tenant:', tenantId);

          let query = supabase.from('recintos').select('*, salas(*)');

          // Filtrar por tenant_id si está disponible
          if (tenantId) {
            query = query.eq('tenant_id', tenantId);
            logger.log('✅ [RecintoSalaContext] Filtrando por tenant_id:', tenantId);
          } else {
            logger.warn('⚠️ [RecintoSalaContext] No hay tenant disponible, consultando sin filtro');
          }

          const { data, error } = await query;
          if (error) {
            logger.error('❌ [RecintoSalaContext] Error fetching recintos:', error.message);
            setRecintos([]);
          } else {
            logger.log('✅ [RecintoSalaContext] Recintos obtenidos:', data?.length || 0);
            setRecintos(data || []);
          }
        } catch (error) {
          logger.error('❌ [RecintoSalaContext] Error inesperado:', error.message);
          setRecintos([]);
        }
      };

      // Solo ejecutar si tenemos un tenant o si estamos en desarrollo
      if (
        tenantId ||
        window.location.hostname === 'localhost' ||
        window.location.hostname.includes('vercel.app')
      ) {
        fetchRecintos();
      }
    }, [currentTenant?.id, recintos.length]);

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

};

export default AutoWrapped_v0bixp;