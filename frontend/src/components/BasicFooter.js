import React from 'react';
import { useFooter } from '../contexts/FooterContext';

const BasicFooter = () => {
  const { footer } = useFooter();
  const text =
    footer?.copyrightText ||
    `© ${new Date().getFullYear()} Zeatingmaps`;
  return (
    <footer className="bg-gray-900 text-white text-center py-4 mt-auto">
      <p className="text-sm">{text}</p>
    </footer>
  );
};

export default BasicFooter;
