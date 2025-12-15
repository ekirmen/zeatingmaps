import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { fetchTags } from '../../services/tagService'; // Usa la función del servicio
import logger from '../../utils/logger';

const TagContext = createContext();

export const TagProvider = ({ children }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;

    const loadTags = async () => {
      hasLoaded.current = true;
      try {
        logger.log('🔍 [TagContext] Iniciando carga de tags...');
        const data = await fetchTags();
        logger.log('🔍 [TagContext] Tags cargados:', data);
        setTags(data);
      } catch (error) {
        logger.error('Error al obtener tags:', error.message);
        setTags([]);
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, []);

  // Log para debuggear el estado de los tags (solo en desarrollo)
  useEffect(() => {
    logger.log('🔍 [TagContext] Estado actual:', {
      tags: tags.length,
      loading,
      tagsCount: tags.length,
    });
  }, [tags.length, loading]);

  return <TagContext.Provider value={{ tags, setTags, loading }}>{children}</TagContext.Provider>;
};

export const useTags = () => {
  const context = useContext(TagContext);
  if (!context) {
    throw new Error('useTags must be used within a TagProvider');
  }
  return context;
};
