import React from 'react';
import { Link } from 'react-router-dom';
import {
  FacebookFilled,
  TwitterOutlined,
  InstagramOutlined,
  SoundOutlined,
  YoutubeFilled,
  TikTokOutlined,
  WhatsAppOutlined,
  SendOutlined
} from '@ant-design/icons';
import { useFooter } from '../contexts/FooterContext';

const BasicFooter = () => {
  const { footer } = useFooter();
  const text =
    footer?.copyrightText ||
    `© ${new Date().getFullYear()} Zeatingmaps`;

  const iconMap = {
    facebook: FacebookFilled,
    twitter: TwitterOutlined,
    instagram: InstagramOutlined,
    spotify: SoundOutlined,
    youtube: YoutubeFilled,
    tiktok: TikTokOutlined,
    whatsapp: WhatsAppOutlined,
    telegram: SendOutlined
  };

  const socials = footer?.socials || {};

  return (
    <footer className="bg-gray-900 text-white py-8" style={{ minHeight: '180px' }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Redes sociales */}
        <div className="flex justify-center mb-6 space-x-4">
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
                className="text-xl hover:text-gray-300 transition-colors"
              >
                <Icon />
              </a>
            );
          })}
        </div>

        {/* Enlaces legales */}
        <div className="flex justify-center mb-6 space-x-6 text-sm">
          <Link
            to="/store/privacy-policy"
            className="hover:text-gray-300 transition-colors"
          >
            Política de Privacidad
          </Link>
          <Link
            to="/store/cookies-policy"
            className="hover:text-gray-300 transition-colors"
          >
            Política de Cookies
          </Link>
          <Link
            to="/store/legal-terms"
            className="hover:text-gray-300 transition-colors"
          >
            Términos y Condiciones
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-sm">{text}</p>
        </div>
      </div>
    </footer>
  );
};

export default BasicFooter;
