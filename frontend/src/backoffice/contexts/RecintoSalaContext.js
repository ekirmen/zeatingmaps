import React, { createContext, useState, useContext } from 'react';

const RecintoSalaContext = createContext();

export const RecintoSalaProvider = ({ children }) => {
  const [recintos, setRecintos] = useState([]);
  const [recinto, setRecinto] = useState(null);
  const [salas, setSalas] = useState([]);
  const [sala, setSala] = useState(null);

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