import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const RefContext = createContext();

export const RefProvider = ({ children }) => {
  const location = useLocation();
  const [refParam, setRefParam] = useState(() => localStorage.getItem('refParam') || '');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      setRefParam(ref);
      localStorage.setItem('refParam', ref);
    }
  }, [location.search]);

  return (
    <RefContext.Provider value={{ refParam }}>
      {children}
    </RefContext.Provider>
  );
};

export const useRefParam = () => {
  const context = useContext(RefContext);
  if (!context) {
    throw new Error('useRefParam must be used within a RefProvider');
  }
  return context;
};
