import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient'; // Ajusta la ruta si es diferente

const TagContext = createContext();

export const TagProvider = ({ children }) => {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error al obtener tags:', error.message);
      } else {
        setTags(data);
      }
    };

    fetchTags();
  }, []);

  return (
    <TagContext.Provider value={{ tags, setTags }}>
      {children}
    </TagContext.Provider>
  );
};

export const useTags = () => {
  const context = useContext(TagContext);
  if (!context) {
    throw new Error('useTags must be used within a TagProvider');
  }
  return context;
};
