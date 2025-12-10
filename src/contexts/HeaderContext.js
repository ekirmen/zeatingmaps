import React, { createContext, useContext, useEffect, useState } from 'react';

const defaultHeader = {
  logoUrl: '',
  companyName: 'TuEmpresa'
};

const HeaderContext = createContext({
  header: defaultHeader,
  updateHeader: () => {}
});

export const HeaderProvider = ({ children }) => {
  const [header, setHeader] = useState(() => {
    const saved = localStorage.getItem('headerSettings');
    return saved ? { ...defaultHeader, ...JSON.parse(saved) } : defaultHeader;
  });

  useEffect(() => {
    localStorage.setItem('headerSettings', JSON.stringify(header));
  }, [header]);

  const updateHeader = updates => {
    setHeader(prev => ({ ...prev, ...updates }));
  };

  return (
    <HeaderContext.Provider value={{ header, updateHeader }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => useContext(HeaderContext);
