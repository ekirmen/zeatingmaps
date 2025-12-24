import React from 'react';
import { Space, Typography } from '../../utils/antdComponents';
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
import { useFooter } from '../../contexts/FooterContext';

const { Text } = Typography;

const DashboardFooter = () => {
  const { footer } = useFooter();
  const socials = footer?.socials || {};
  const copyrightText =
    footer?.copyrightText || `é ${new Date().getFullYear()} VenEventos`;

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


