import React, { useState } from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaSpotify, FaYoutube, FaWhatsapp, FaTiktok, FaTelegram } from 'react-icons/fa';
import { useFooter } from '../../contexts/FooterContext';

const networks = [
  { key: 'facebookUrl', label: 'Facebook', icon: FaFacebook },
  { key: 'twitterUrl', label: 'Twitter', icon: FaTwitter },
  { key: 'instagramUrl', label: 'Instagram', icon: FaInstagram },
  { key: 'spotifyUrl', label: 'Spotify', icon: FaSpotify },
  { key: 'youtubeUrl', label: 'YouTube', icon: FaYoutube },
  { key: 'whatsappUrl', label: 'WhatsApp', icon: FaWhatsapp },
  { key: 'tiktokUrl', label: 'TikTok', icon: FaTiktok },
  { key: 'telegramUrl', label: 'Telegram', icon: FaTelegram }
];

const NetworkInput = ({ label, Icon, value, onChange }) => (
  <div className="large-6 medium-6 small-12 columns">
    <div className="tracker-selector flex items-center gap-2 mb-2">
      <div className="logo-tracker">
        <Icon className="w-6 h-6" />
      </div>
      <div className="info-tracker flex-1">
        <label className="block text-sm">
          {label}
          <input
            type="text"
            className="border ml-2 p-1 w-full"
            maxLength={100}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </label>
      </div>
    </div>
  </div>
);

const WebFooter = () => {
  const { footer, updateFooter } = useFooter();
  const [data, setData] = useState({ ...footer });

  const handleChange = (key, value) => setData(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    updateFooter(data);
    alert('Pie de página guardado');
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Pie de página</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {networks.map(n => (
          <NetworkInput
            key={n.key}
            label={n.label}
            Icon={n.icon}
            value={data[n.key]}
            onChange={val => handleChange(n.key, val)}
          />
        ))}
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">Texto copyright</label>
        <input
          type="text"
          className="border w-full p-1"
          maxLength={100}
          value={data.copyrightText}
          onChange={e => handleChange('copyrightText', e.target.value)}
        />
      </div>
      <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave}>
        Guardar
      </button>
    </div>
  );
};

export default WebFooter;
