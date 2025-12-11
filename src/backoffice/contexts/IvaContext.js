import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useTenant } from '../../contexts/TenantContext';

const IvaContext = createContext();

export const IvaProvider = ({ children }) => {
  const { currentTenant } = useTenant();
  const [ivas, setIvas] = useState([]);

  useEffect(() => {
    const fetchIvas = async () => {
      if (!currentTenant?.id) {

        return;
      }

      // Si es main-domain, no filtrar por tenant_id
      let query = supabase.from('ivas').select('*');

      if (currentTenant.id !== 'main-domain') {
        query = query.eq('tenant_id', currentTenant.id);
      }

      const { data, error } = await query.order('nombre', { ascending: true });

      if (error) {
        console.error('Error al obtener IVAs:', error.message);
        setIvas([]);
      } else {
        setIvas(data || []);
      }
    };

    fetchIvas();
  }, [currentTenant?.id]);

  return (
    <IvaContext.Provider value={{ ivas, setIvas }}>
      {children}
    </IvaContext.Provider>
  );
};

export const useIva = () => {
  const context = useContext(IvaContext);
  if (!context) {
    throw new Error('useIva must be used within an IvaProvider');
  }
  return context;
};
