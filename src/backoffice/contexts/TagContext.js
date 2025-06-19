import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchTags } from '../../services/tagService'; // Usa la función del servicio

const TagContext = createContext();

export const TagProvider = ({ children }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const data = await fetchTags();
        setTags(data);
      } catch (error) {
        console.error('Error al obtener tags:', error.message);
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, []);

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
