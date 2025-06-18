import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE_URL from '../../utils/apiBase';

const RecintoContext = createContext();

export const RecintoProvider = ({ children }) => {
  const [recintos, setRecintos] = useState([]);
  const [recintoSeleccionado, setRecintoSeleccionado] = useState(() => {
    const stored = localStorage.getItem('recintoSeleccionado');
    return stored ? JSON.parse(stored) : null;
  });
  const [salaSeleccionada, setSalaSeleccionada] = useState(() => {
    const stored = localStorage.getItem('salaSeleccionada');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const fetchRecintos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/recintos`);
        const data = await response.json();
        setRecintos(data);
      } catch (error) {
        console.error('Error fetching recintos:', error);
      }
    };
    fetchRecintos();
  }, []);

  useEffect(() => {
    if (recintoSeleccionado) {
      localStorage.setItem('recintoSeleccionado', JSON.stringify(recintoSeleccionado));
    } else {
      localStorage.removeItem('recintoSeleccionado');
    }
  }, [recintoSeleccionado]);

  useEffect(() => {
    if (salaSeleccionada) {
      localStorage.setItem('salaSeleccionada', JSON.stringify(salaSeleccionada));
    } else {
      localStorage.removeItem('salaSeleccionada');
    }
  }, [salaSeleccionada]);

  return (
    <RecintoContext.Provider
      value={{
        recintos,
        setRecintos,
        recintoSeleccionado,
        setRecintoSeleccionado,
        salaSeleccionada,
        setSalaSeleccionada,
      }}
    >
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
