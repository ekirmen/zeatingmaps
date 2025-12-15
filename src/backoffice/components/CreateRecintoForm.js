// src/components/CreateRecintoForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { geocodeAddress } from '../../utils/geocode';
import buildAddress from '../../utils/address';

const CreateRecintoForm = ({ onCreateRecinto, onCancel }) => {
  const { user } = useAuth();
  const [nombre, setNombre] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [showAddress, setShowAddress] = useState(false);

  // ⚠️  Todos los campos en snake_case y minúsculas
  const [details, setDetails] = useState({
    pais: '',
    estado: '',
    ciudad: '',
    codigopostal: '',
    direccionlinea1: '',
    latitud: '',
    longitud: '',
    comollegar: '',
  });

  const [mapUrl, setMapUrl] = useState('');

  /* ----------------- helpers ----------------- */
  const handleSearchAddress = async () => {
    const fullAddress = buildAddress(details);
    const geo = await geocodeAddress(fullAddress);

    if (geo) {
      setDetails(prev => ({
        ...prev,
        latitud: geo.lat,
        longitud: geo.lon,
      }));
      setMapUrl(`https://www.google.com/maps?q=${geo.lat},${geo.lon}&output=embed`);
    } else if (fullAddress) {
      setMapUrl(`https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      // Obtener tenant_id del usuario autenticado
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // 👉 buildAddress(details) genera 'direccion'
      onCreateRecinto({
        nombre,
        direccion: buildAddress(details),
        capacidad: Number(capacidad), // guarda como integer
        ...details, // incluye pais, estado, codigopostal, etc.
        tenant_id: profile.tenant_id, // incluir tenant_id
      });
    } catch (error) {
      console.error('Error al obtener tenant_id:', error);
      alert('Error al obtener información del usuario. Por favor, inténtalo de nuevo.');
    }
  };

  const fullAddress = buildAddress(details);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <label className="block">
        <span className="font-medium">Nombre del recinto</span>
        <input
          type="text"
          className="border w-full px-2 py-1 rounded"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
        />
      </label>

      {/* Dirección compuesta */}
      <label className="block">
        <span className="font-medium">Dirección</span>
        <input
          type="text"
          className="border w-full px-2 py-1 rounded"
          value={fullAddress}
          readOnly
          onFocus={() => setShowAddress(true)}
          placeholder="Completa los detalles"
          required
        />
      </label>

      {/* Detalles extendidos de la dirección */}
      {showAddress && (
        <div className="border p-3 rounded space-y-2 bg-gray-50">
          {[
            ['pais', 'País'],
            ['estado', 'Estado'],
            ['ciudad', 'Ciudad'],
            ['codigopostal', 'Código postal'],
            ['direccionlinea1', 'Línea de dirección 1'],
          ].map(([field, placeholder]) => (
            <input
              key={field}
              type="text"
              className="border w-full px-2 py-1 rounded"
              placeholder={placeholder}
              value={details[field]}
              onChange={e => setDetails({ ...details, [field]: e.target.value })}
            />
          ))}

          <button
            type="button"
            onClick={handleSearchAddress}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Buscar dirección
          </button>

          {mapUrl && (
            <iframe
              title="map"
              src={mapUrl}
              width="100%"
              height="200"
              className="rounded"
              allowFullScreen
              loading="lazy"
            />
          )}

          <input
            type="text"
            className="border w-full px-2 py-1 rounded"
            placeholder="Cómo llegar"
            value={details.comollegar}
            onChange={e => setDetails({ ...details, comollegar: e.target.value })}
          />

          {/* Lat / Lon readonly */}
          <div className="grid grid-cols-2 gap-2">
            {['latitud', 'longitud'].map(field => (
              <input
                key={field}
                type="text"
                className="border w-full px-2 py-1 rounded bg-gray-100"
                placeholder={field}
                value={details[field]}
                readOnly
              />
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAddress(false)}
              className="bg-gray-400 text-white px-3 py-1 rounded"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Capacidad */}
      <label className="block">
        <span className="font-medium">Capacidad</span>
        <input
          type="number"
          className="border w-full px-2 py-1 rounded"
          value={capacidad}
          onChange={e => setCapacidad(e.target.value)}
          required
        />
      </label>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded">
          Crear
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default CreateRecintoForm;
