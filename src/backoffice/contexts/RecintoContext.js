import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';

// ✅ EXPORTADO correctamente
export const RecintoContext = createContext();

export const RecintoProvider = ({ children }) => {
  const { currentTenant } = useTenant();
  const [recintos, setRecintos] = useState([]);
  const [recintoSeleccionado, setRecintoSeleccionado] = useState(null);
  const [salaSeleccionada, setSalaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);

  const prevTenantId = useRef(null);

  useEffect(() => {
    const storedRecinto = localStorage.getItem('recintoSeleccionado');
    const storedSala = localStorage.getItem('salaSeleccionada');
    
    if (storedRecinto) {
      try {
        setRecintoSeleccionado(JSON.parse(storedRecinto));
      } catch (error) {
        localStorage.removeItem('recintoSeleccionado');
      }
    }
    
    if (storedSala) {
      try {
        setSalaSeleccionada(JSON.parse(storedSala));
      } catch (error) {
        localStorage.removeItem('salaSeleccionada');
      }
    }
  }, []);

  const fetchRecintos = useCallback(async () => {
    const tenantId = currentTenant?.id;

    if (tenantId === prevTenantId.current) return;
    
    prevTenantId.current = tenantId;
    setLoading(true);

    try {
      let query = supabase
        .from('recintos')
        .select('*, salas(*)')
        .order('nombre');

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRecintos(data || []);
    } catch (error) {
      console.error('Error al obtener recintos:', error.message);
      setRecintos([]);
    } finally {
      setLoading(false);
    }
  }, [currentTenant?.id]);

  useEffect(() => {
    fetchRecintos();
  }, [fetchRecintos]);

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

  const value = {
    recintos,
    loading,
    recintoSeleccionado,
    setRecintoSeleccionado,
    salaSeleccionada,
    setSalaSeleccionada,
    refetchRecintos: fetchRecintos
  };

  return (
    <RecintoContext.Provider value={value}>
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