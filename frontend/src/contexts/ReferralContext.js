import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ReferralContext = createContext();

export const ReferralProvider = ({ children }) => {
  const location = useLocation();
  const [referralCode, setReferralCode] = useState(() => localStorage.getItem('referralCode') || '');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      localStorage.setItem('referralCode', ref);
    }
  }, [location.search]);

  return (
    <ReferralContext.Provider value={{ referralCode }}>
      {children}
    </ReferralContext.Provider>
  );
};

export const useReferral = () => {
  const context = useContext(ReferralContext);
  if (!context) {
    throw new Error('useReferral must be used within a ReferralProvider');
  }
  return context;
};
