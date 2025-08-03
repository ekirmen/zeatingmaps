import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const IvaContext = createContext();

export const IvaProvider = ({ children }) => {
  const [ivas, setIvas] = useState([]);

  useEffect(() => {
    const fetchIvas = async () => {
      const { data, error } = await supabase
        .from('ivas')
        .select('*')
        .order('nombre', { ascending: true }); // Orden opcional

      if (error) {
        console.error('Error al obtener IVAs:', error.message);
      } else {
        setIvas(data);
      }
    };

    fetchIvas();
  }, []);

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
