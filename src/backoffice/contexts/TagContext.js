import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchTags } from '../../services/tagService'; // Usa la función del servicio

const TagContext = createContext();

export const TagProvider = ({ children }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTags = async () => {
      try {
        console.log('🔍 [TagContext] Iniciando carga de tags...');
        const data = await fetchTags();
        console.log('🔍 [TagContext] Tags cargados:', data);
        setTags(data);
      } catch (error) {
        console.error('Error al obtener tags:', error.message);
        setTags([]);
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, []);

  // Log para debuggear el estado de los tags
  console.log('🔍 [TagContext] Estado actual:', { tags, loading, tagsCount: tags.length });

  return (
    <TagContext.Provider value={{ tags, setTags, loading }}>
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
