import React, { createContext, useContext, useState, useEffect } from 'react';

const IvaContext = createContext();

export const IvaProvider = ({ children }) => {
  const [ivas, setIvas] = useState([]);

  useEffect(() => {
    const fetchIvas = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/ivas');
        const data = await response.json();
        setIvas(data);
      } catch (error) {
        console.error('Error fetching ivas:', error);
      }
    };
    fetchIvas();
  }, []);

  return (
    <IvaContext.Provider value={{ ivas, setIvas }}>
      {children}
    </IvaContext.Provider>
  );
};

export const useIva = () => {
  const context = useContext(IvaContext);
  if (!context) {
    throw new Error('useIva must be used within an IvaProvider');
  }
  return context;
};
