// src/contexts/RefContext.js
import React, { createContext, useContext, useRef } from 'react';

const RefContext = createContext();

export const RefProvider = ({ children }) => {
  const refs = useRef({});
  
  const registerRef = (name, ref) => {
    refs.current[name] = ref;
  };
  

    return refs.current[name];
  };
  
  const value = {
    registerRef,
    getRef,
    refs: refs.current
  };
  
  return (
    <RefContext.Provider value={value}>
      {children}
    </RefContext.Provider>
  );
};

export const useRefContext = () => {
  const context = useContext(RefContext);
  if (!context) {
    throw new Error('useRefContext debe usarse dentro de RefProvider');
  }
  return context;
};