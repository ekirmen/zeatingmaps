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
  const [showMapModal, setShowMapModal] = useState(false);

  /* ----------------- helpers ----------------- */
  const handleSearchAddress = async () => {
    const fullAddress = buildAddress(details);
    const geo = await geocodeAddress(fullAddress);

    if (geo) {
      setDetails((prev) => ({
        ...prev,
        latitud: geo.lat,
        longitud: geo.lon,
      }));
      setMapUrl(
        `https://www.google.com/maps?q=${geo.lat},${geo.lon}&output=embed`
      );
    } else if (fullAddress) {
      setMapUrl(
        `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`
      );
    }
  };

  const handleSubmit = async (e) => {
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
        ...details,                   // incluye pais, estado, codigopostal, etc.
        tenant_id: profile.tenant_id, // incluir tenant_id
      });
    } catch (error) {
      console.error('Error al obtener tenant_id:', error);
      alert('Error al obtener información del usuario. Por favor, inténtalo de nuevo.');
    }
  };

  const fullAddress = buildAddress(details);

  const modalMapUrl = mapUrl
    || (details.latitud && details.longitud
      ? `https://www.google.com/maps?q=${details.latitud},${details.longitud}&output=embed`
      : fullAddress
        ? `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`
        : '');

  const hasAddressDetails = Boolean(fullAddress);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <label className="block">
        <span className="font-medium">Nombre del recinto</span>
        <input
          type="text"
          className="border w-full px-2 py-1 rounded"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
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
              onChange={(e) =>
                setDetails({ ...details, [field]: e.target.value })
              }
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
            onChange={(e) =>
              setDetails({ ...details, comollegar: e.target.value })
            }
          />

          {/* Lat / Lon readonly */}
          <div className="grid grid-cols-2 gap-2">
            {['latitud', 'longitud'].map((field) => (
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

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => hasAddressDetails && setShowMapModal(true)}
              disabled={!hasAddressDetails}
              className={`px-3 py-1 rounded text-white ${hasAddressDetails ? 'bg-green-600 hover:bg-green-700' : 'bg-green-300 cursor-not-allowed'}`}
            >
              Validar
            </button>
            <button
              type="button"
              onClick={() => setShowAddress(false)}
              className="bg-gray-400 text-white px-3 py-1 rounded"
            >
              Cancelar
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
          onChange={(e) => setCapacidad(e.target.value)}
          required
        />
      </label>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          className="bg-blue-700 text-white px-4 py-2 rounded"
        >
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

      {showMapModal && modalMapUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Validar dirección</h3>
                <p className="text-sm text-gray-500">Revisa que la ubicación coincida con el recinto</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Cerrar</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="aspect-video w-full bg-gray-100">
              <iframe
                title="Vista previa de la dirección"
                src={modalMapUrl}
                width="100%"
                height="100%"
                loading="lazy"
                allowFullScreen
                style={{ border: 0 }}
              />
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default CreateRecintoForm;
