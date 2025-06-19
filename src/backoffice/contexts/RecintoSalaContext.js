import React, { createContext, useState, useContext, useEffect } from 'react';

const RecintoSalaContext = createContext();

export const RecintoSalaProvider = ({ children }) => {
  const [recintos, setRecintos] = useState([]);
  const [recinto, setRecinto] = useState(() => {
    const stored = localStorage.getItem('recinto');
    return stored ? JSON.parse(stored) : null;
  });
  const [salas, setSalas] = useState([]);
  const [sala, setSala] = useState(() => {
    const stored = localStorage.getItem('sala');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (recinto) {
      localStorage.setItem('recinto', JSON.stringify(recinto));
    } else {
      localStorage.removeItem('recinto');
    }
  }, [recinto]);

  useEffect(() => {
    if (sala) {
      localStorage.setItem('sala', JSON.stringify(sala));
    } else {
      localStorage.removeItem('sala');
    }
  }, [sala]);

  return (
    <RecintoSalaContext.Provider
      value={{
        recintos,
        setRecintos,
        recinto,
        setRecinto,
        salas,
        setSalas,
        sala,
        setSala,
      }}
    >
      {children}
    </RecintoSalaContext.Provider>
  );
};

export const useRecintoSala = () => {
  const context = useContext(RecintoSalaContext);
  if (!context) {
    throw new Error('useRecintoSala debe ser usado dentro de RecintoSalaProvider');
  }
  return context;
};