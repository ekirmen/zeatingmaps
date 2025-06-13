import React, { useState } from 'react';
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaSpotify,
  FaYoutube,
  FaWhatsapp,
  FaTelegram
} from 'react-icons/fa';
import { FaTiktok } from 'react-icons/fa6';
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

const isValidUrl = (url) => {
  if (!url) return true; // permite vacío
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const NetworkInput = ({ label, Icon, value, onChange, isInvalid }) => (
  <div className="flex items-center gap-2">
    <Icon className="w-6 h-6 text-gray-600" />
    <div className="flex-1">
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        className={`border p-2 w-full rounded ${
          isInvalid ? 'border-red-500' : 'border-gray-300'
        }`}
        placeholder={`https://...`}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {isInvalid && (
        <p className="text-xs text-red-500 mt-1">URL inválida</p>
      )}
    </div>
  </div>
);

const WebFooter = () => {
  const { footer, updateFooter } = useFooter();
  const [data, setData] = useState({ ...footer });
  const [errors, setErrors] = useState({});

  const handleChange = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: !isValidUrl(value) }));
  };

  const handleSave = () => {
    const newErrors = {};
    let hasError = false;

    for (const { key } of networks) {
      if (!isValidUrl(data[key])) {
        newErrors[key] = true;
        hasError = true;
      }
    }

    setErrors(newErrors);

    if (hasError) {
      alert('Hay enlaces inválidos. Corrige antes de guardar.');
      return;
    }

    updateFooter(data);
    alert('Pie de página guardado');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Pie de página</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {networks.map(({ key, label, icon: Icon }) => (
          <NetworkInput
            key={key}
            label={label}
            Icon={Icon}
            value={data[key]}
            onChange={val => handleChange(key, val)}
            isInvalid={!!errors[key]}
          />
        ))}
      </div>

      <div className="mt-8">
        <label className="block text-sm font-medium mb-1">Texto copyright</label>
        <input
          type="text"
          className="border p-2 w-full rounded border-gray-300"
          maxLength={100}
          value={data.copyrightText}
          onChange={e => handleChange('copyrightText', e.target.value)}
        />
      </div>

      <div className="mt-6 text-right">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
          onClick={handleSave}
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default WebFooter;
