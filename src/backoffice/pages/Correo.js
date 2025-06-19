import React, { useEffect, useState } from 'react';
import { fetchEmailTemplates, saveEmailTemplate } from '../../services/emailTemplateService';

const defaultData = {
  reservation: { subject: '', body: '' },
  paid: { subject: '', body: '' },
  resetPassword: { subject: '', body: '' }
};

const Correo = () => {
  const [templates, setTemplates] = useState(defaultData);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchEmailTemplates(token);
        const map = { ...defaultData };
        data.forEach(t => { map[t.type] = { subject: t.subject, body: t.body }; });
        setTemplates(map);
      } catch (e) { console.error(e); }
    };
    load();
  }, [token]);

  const handleChange = (type, field, value) => {
    setTemplates(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const handleSave = async (type) => {
    try {
      await saveEmailTemplate(type, templates[type], token);
      alert('Guardado');
    } catch (e) {
      console.error(e);
      alert('Error al guardar');
    }
  };

  const sections = [
    { key: 'reservation', label: 'Correo de Reserva' },
    { key: 'paid', label: 'Correo de Pagado' },
    { key: 'resetPassword', label: 'Correo de Restablecer Contraseña' }
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Plantillas de Correo</h2>
      {sections.map(sec => (
        <div key={sec.key} className="mb-6 border p-4 rounded">
          <h3 className="font-semibold mb-2">{sec.label}</h3>
          <input
            className="border w-full p-1 mb-2"
            placeholder="Asunto"
            value={templates[sec.key].subject}
            onChange={e => handleChange(sec.key, 'subject', e.target.value)}
          />
          <textarea
            className="border w-full p-1 h-32"
            placeholder="HTML del correo"
            value={templates[sec.key].body}
            onChange={e => handleChange(sec.key, 'body', e.target.value)}
          />
          <button
            className="mt-2 bg-blue-600 text-white px-3 py-1 rounded"
            onClick={() => handleSave(sec.key)}
          >
            Guardar
          </button>
        </div>
      ))}
    </div>
  );
};

export default Correo;
