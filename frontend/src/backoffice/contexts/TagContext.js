import React, { createContext, useContext, useEffect, useState } from 'react';

const TagContext = createContext();

export const TagProvider = ({ children }) => {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/tags`);
        const data = await res.json();
        setTags(data);
      } catch (e) {
        console.error('Error fetching tags:', e);
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
