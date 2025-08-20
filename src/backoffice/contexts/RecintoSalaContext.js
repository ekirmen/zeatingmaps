import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';

const RecintoSalaContext = createContext();

export const RecintoSalaProvider = ({ children }) => {
  // Hook para obtener el tenant de forma segura - SIEMPRE debe estar en el nivel superior
  const tenantContext = useTenant();
  const currentTenant = tenantContext?.currentTenant || null;

  // Verificación de seguridad para evitar errores de inicialización
  const [isInitialized, setIsInitialized] = useState(false);
  const [recintos, setRecintos] = useState([]);
  const [recinto, setRecinto] = useState(() => {
    try {
      const stored = localStorage.getItem('recinto');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('⚠️ [RecintoSalaContext] Error al leer recinto del localStorage:', error);
      return null;
    }
  });
  const [salas, setSalas] = useState([]);
  const [sala, setSala] = useState(() => {
    try {
      const stored = localStorage.getItem('sala');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('⚠️ [RecintoSalaContext] Error al leer sala del localStorage:', error);
      return null;
    }
  });

  useEffect(() => {
    // Marcar como inicializado después de un breve delay
    const initTimer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(initTimer);
  }, []);

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

  useEffect(() => {
    // Solo ejecutar si el contexto está inicializado
    if (!isInitialized) return;

    const fetchRecintos = async () => {
      try {
        console.log('🔍 [RecintoSalaContext] Obteniendo recintos para tenant:', currentTenant?.id);
        
        let query = supabase.from('recintos').select('*, salas(*)');
        
        // Filtrar por tenant_id si está disponible
        if (currentTenant?.id && currentTenant.id !== '00000000-0000-0000-0000-000000000000') {
          query = query.eq('tenant_id', currentTenant.id);
          console.log('✅ [RecintoSalaContext] Filtrando por tenant_id:', currentTenant.id);
        } else {
          console.warn('⚠️ [RecintoSalaContext] No hay tenant disponible o es dominio principal, consultando sin filtro');
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
  }, [currentTenant, isInitialized]);

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
    console.warn('⚠️ [RecintoSalaContext] Contexto no disponible, retornando valores por defecto');
    return {
      recintos: [],
      setRecintos: () => {},
      recinto: null,
      setRecinto: () => {},
      salas: [],
      setSalas: () => {},
      sala: null,
      setSala: () => {},
    };
  }
  return context;
};
