import React from 'react';
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaSpotify,
  FaYoutube,
  FaTiktok,
  FaWhatsapp,
  FaTelegramPlane
} from 'react-icons/fa';
import { useFooter } from '../contexts/FooterContext';

const BasicFooter = () => {
  const { footer } = useFooter();
  const text =
    footer?.copyrightText ||
    `© ${new Date().getFullYear()} Zeatingmaps`;

  const iconMap = {
    facebook: FaFacebookF,
    twitter: FaTwitter,
    instagram: FaInstagram,
    spotify: FaSpotify,
    youtube: FaYoutube,
    tiktok: FaTiktok,
    whatsapp: FaWhatsapp,
    telegram: FaTelegramPlane
  };

  const socials = footer?.socials || {};

  return (
    <footer className="bg-gray-900 text-white text-center py-4 mt-auto">
      <div className="flex justify-center mb-2 space-x-4">
        {Object.entries(socials).map(([key, config]) => {
          if (!config.active || !config.url) return null;
          const Icon = iconMap[key];
          if (!Icon) return null;
          return (
            <a
              key={key}
              href={config.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl hover:text-gray-300"
            >
              <Icon />
            </a>
          );
        })}
      </div>
      <p className="text-sm">{text}</p>
    </footer>
  );
};

export default BasicFooter;
