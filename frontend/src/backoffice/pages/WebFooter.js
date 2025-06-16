import React, { useState, useEffect } from 'react';
import { useFooter } from '../../contexts/FooterContext';

const SOCIAL_FIELDS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'twitter', label: 'Twitter' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'spotify', label: 'Spotify' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'telegram', label: 'Telegram' }
];

const WebFooter = () => {
  const { footer, updateFooter } = useFooter();
  const [text, setText] = useState(footer?.copyrightText || '');
  const [reservationTime, setReservationTime] = useState(15);
  const [socials, setSocials] = useState(() => {
    return SOCIAL_FIELDS.reduce((acc, { key }) => {
      acc[key] = {
        active: footer?.socials?.[key]?.active || false,
        url: footer?.socials?.[key]?.url || ''
      };
      return acc;
    }, {});
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/settings/reservation-time`);
        if (res.ok) {
          const data = await res.json();
          setReservationTime(data.value);
        }
      } catch {}
    };
    load();
  }, []);

  const handleSocialChange = (key, field, value) => {
    setSocials(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const handleSave = async () => {
    updateFooter({ copyrightText: text, socials });
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/settings/reservation-time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ value: reservationTime })
      });
    } catch {}
    alert('Configuración guardada');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Sitio web</h2>
      <label className="block text-sm font-medium mb-1">Texto copyright</label>
      <input
        type="text"
        className="border p-2 w-full rounded border-gray-300"
        maxLength={100}
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <label className="block text-sm font-medium mb-1 mt-4">Tiempo de reserva (minutos)</label>
      <select
        className="border p-2 rounded w-32"
        value={reservationTime}
        onChange={e => setReservationTime(parseInt(e.target.value, 10))}
      >
        <option value={15}>15</option>
        <option value={30}>30</option>
        <option value={45}>45</option>
      </select>
      <h3 className="text-xl font-semibold mt-6 mb-4">Redes Sociales</h3>
      {SOCIAL_FIELDS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            checked={socials[key].active}
            onChange={e => handleSocialChange(key, 'active', e.target.checked)}
          />
          <span className="w-28">{label}</span>
          <input
            type="text"
            className="flex-1 border p-2 rounded border-gray-300"
            placeholder="URL"
            value={socials[key].url}
            onChange={e => handleSocialChange(key, 'url', e.target.value)}
          />
        </div>
      ))}
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
