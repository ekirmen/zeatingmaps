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
  const parseSaved = (saved) => {
    try {
      const parsed = JSON.parse(saved);
      return Object.keys(defaultFooter).reduce((acc, key) => {
        acc[key] = typeof parsed[key] === 'string' ? parsed[key] : '';
        return acc;
      }, { ...defaultFooter });
    } catch {
      return { ...defaultFooter };
    }
  };

  const [footer, setFooter] = useState(() => {
    const saved = localStorage.getItem('footerSettings');
    const parsed = saved ? parseSaved(saved) : defaultFooter;
    return parsed;
  });

  useEffect(() => {
    localStorage.setItem('footerSettings', JSON.stringify(footer));
  }, [footer]);

  const updateFooter = (updates) => {
    setFooter(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('footerSettings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <FooterContext.Provider value={{ footer, updateFooter }}>
      {children}
    </FooterContext.Provider>
  );
};

export const useFooter = () => useContext(FooterContext);
