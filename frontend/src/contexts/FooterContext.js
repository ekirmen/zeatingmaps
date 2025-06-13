import React, { createContext, useContext, useEffect, useState } from 'react';

const defaultFooter = {
  copyrightText: '',
  facebookUrl: '',
  twitterUrl: '',
  instagramUrl: '',
  spotifyUrl: '',
  youtubeUrl: '',
  whatsappUrl: '',
  tiktokUrl: '',
  telegramUrl: ''
};

const FooterContext = createContext({
  footer: defaultFooter,
  updateFooter: () => {}
});

export const FooterProvider = ({ children }) => {
  const [footer, setFooter] = useState(() => {
    const saved = localStorage.getItem('footerSettings');
    return saved ? { ...defaultFooter, ...JSON.parse(saved) } : defaultFooter;
  });

  useEffect(() => {
    localStorage.setItem('footerSettings', JSON.stringify(footer));
  }, [footer]);

  const updateFooter = updates => {
    setFooter(prev => ({ ...prev, ...updates }));
  };

  return (
    <FooterContext.Provider value={{ footer, updateFooter }}>
      {children}
    </FooterContext.Provider>
  );
};

export const useFooter = () => useContext(FooterContext);
