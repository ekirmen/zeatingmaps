import React from 'react';
import { Space, Typography } from '../../utils/antdComponents';
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaSpotify,
  FaYoutube,
  FaTiktok,
  FaWhatsapp,
  FaTelegramPlane,
} from 'react-icons/fa';
import { useFooter } from '../../contexts/FooterContext';

const { Text } = Typography;

const DashboardFooter = () => {
  const { footer } = useFooter();
  const socials = footer?.socials || {};
  const copyrightText = footer?.copyrightText || `© ${new Date().getFullYear()} VenEventos`;

  const iconMap = {
    facebook: FaFacebookF,
    twitter: FaTwitter,
    instagram: FaInstagram,
    spotify: FaSpotify,
    youtube: FaYoutube,
    tiktok: FaTiktok,
    whatsapp: FaWhatsapp,
    telegram: FaTelegramPlane,
  };

  return (
    <div className="dashboard-footer-content">
      <Text type="secondary" className="dashboard-footer-copy">
        {copyrightText}
      </Text>
      <Space size={12} wrap>
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
              className="dashboard-footer-social"
            >
              <Icon size={16} />
            </a>
          );
        })}
      </Space>
    </div>
  );
};

export default DashboardFooter;
