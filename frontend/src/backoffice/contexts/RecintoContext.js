import React, { createContext, useContext, useState, useEffect } from 'react';

const RecintoContext = createContext();

export const RecintoProvider = ({ children }) => {
  const [recintos, setRecintos] = useState([]);

  useEffect(() => {
    const fetchRecintos = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/recintos');
        const data = await response.json();
        setRecintos(data);
      } catch (error) {
        console.error('Error fetching recintos:', error);
      }
    };
    fetchRecintos();
  }, []);

  return (
    <RecintoContext.Provider value={{ recintos, setRecintos }}>
      {children}
    </RecintoContext.Provider>
  );
};

export const useRecinto = () => {
  const context = useContext(RecintoContext);
  if (!context) {
    throw new Error('useRecinto must be used within a RecintoProvider');
  }
  return context;
};
