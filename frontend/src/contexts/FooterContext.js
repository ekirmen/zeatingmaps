import React, { createContext, useContext, useEffect, useState } from 'react';

const SOCIAL_KEYS = [
  'facebook',
  'twitter',
  'instagram',
  'spotify',
  'youtube',
  'tiktok',
  'whatsapp',
  'telegram'
];

// Default footer data including socials configuration
const defaultFooter = {
  copyrightText: '',
  socials: SOCIAL_KEYS.reduce((acc, key) => {
    acc[key] = { active: false, url: '' };
    return acc;
  }, {})
};

const FooterContext = createContext({
  footer: defaultFooter,
  updateFooter: () => {}
});

export const FooterProvider = ({ children }) => {
  const parseSaved = saved => {
    try {
      const parsed = JSON.parse(saved);
      const result = { ...defaultFooter };
      if (typeof parsed.copyrightText === 'string') {
        result.copyrightText = parsed.copyrightText;
      }
      if (parsed.socials && typeof parsed.socials === 'object') {
        SOCIAL_KEYS.forEach(key => {
          const s = parsed.socials[key] || {};
          result.socials[key] = {
            active: !!s.active,
            url: typeof s.url === 'string' ? s.url : ''
          };
        });
      }
      return result;
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

  const updateFooter = updates => {
    setFooter(prev => {
      const updated = {
        ...prev,
        ...updates,
        socials: {
          ...prev.socials,
          ...(updates.socials || {})
        }
      };
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
