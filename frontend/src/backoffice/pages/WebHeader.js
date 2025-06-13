import React, { useState } from 'react';
import { useHeader } from '../../contexts/HeaderContext';

const WebHeader = () => {
  const { header, updateHeader } = useHeader();
  const [companyName, setCompanyName] = useState(header?.companyName || 'TuEmpresa');
  const [logoUrl, setLogoUrl] = useState(header?.logoUrl || '');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('token');
      const authHeader = token && !token.startsWith('Bearer ')
        ? `Bearer ${token}`
        : token;
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: authHeader } : {},
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al subir imagen');
      setLogoUrl(data.url || data.path || '');
    } catch (err) {
      console.error('Upload error:', err);
      alert(err.message);
    }
  };

  const handleSave = () => {
    updateHeader({ logoUrl, companyName });
    alert('Cabecera guardada');
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Cabecera</h2>


      <label className="block text-sm font-medium mb-1 mt-4">Logo</label>
      <input type="file" accept=".jpg,.png" onChange={handleFileChange} />
      {logoUrl && (
        <img
          src={`http://localhost:5000${logoUrl}`}
          alt="Logo"
          className="h-12 mt-2"
        />
      )}

      <label className="block text-sm font-medium mb-1 mt-4">Nombre Empresa</label>
      <input
        type="text"
        className="border p-2 w-full rounded border-gray-300"
        value={companyName}
        maxLength={15}
        onChange={e => setCompanyName(e.target.value)}
      />

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

export default WebHeader;
