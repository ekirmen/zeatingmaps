import React, { useState } from 'react';
import { useHeader } from '../../contexts/HeaderContext';
import { supabase } from '../../backoffice/services/supabaseClient';

// Allow custom bucket name via environment variable
const rawLogoBucket = process.env.REACT_APP_LOGO_BUCKET || 'logos';
const LOGO_BUCKET = rawLogoBucket.replace(/^\/+|\/+$/g, '');
// Optional subdirectory inside the bucket
const rawLogoFolder = process.env.REACT_APP_LOGO_FOLDER || '';
const LOGO_FOLDER = rawLogoFolder.replace(/^\/+|\/+$/g, '');

const WebHeader = () => {
  const { header, updateHeader } = useHeader();
  const [companyName, setCompanyName] = useState(header?.companyName || 'TuEmpresa');
  const [logoUrl, setLogoUrl] = useState(header?.logoUrl || '');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = LOGO_FOLDER ? `${LOGO_FOLDER}/${fileName}` : `${fileName}`;

    setUploading(true);
    const { error } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error.message);
      alert('Error al subir imagen');
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(filePath);

    if (publicData?.publicUrl) {
      setLogoUrl(publicData.publicUrl);
    }

    setUploading(false);
  };

  const handleSave = () => {
    updateHeader({ logoUrl, companyName });
    alert('Cabecera guardada');
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Cabecera</h2>

      <label className="block text-sm font-medium mb-1">Logo</label>
      <input type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />
      {uploading && <p className="text-sm text-gray-500 mt-1">Subiendo imagen...</p>}
      {logoUrl && (
        <img
          src={logoUrl}
          alt="Logo"
          className="h-16 mt-4 object-contain"
        />
      )}

      <label className="block text-sm font-medium mt-6 mb-1">Nombre Empresa</label>
      <input
        type="text"
        value={companyName}
        maxLength={30}
        onChange={e => setCompanyName(e.target.value)}
        className="border p-2 w-full rounded border-gray-300"
      />

      <div className="mt-6 text-right">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default WebHeader;
