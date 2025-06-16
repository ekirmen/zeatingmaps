// src/components/CreateRecintoForm.js
import React, { useState } from 'react';

const geocodeAddress = async (address) => {
  if (process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
    const googleRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
    );
    const googleData = await googleRes.json();
    if (googleData.results && googleData.results.length) {
      const loc = googleData.results[0].geometry.location;
      return { lat: loc.lat, lon: loc.lng };
    }
  }
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
  );
  const data = await res.json();
  return data && data.length ? { lat: data[0].lat, lon: data[0].lon } : null;
};

const CreateRecintoForm = ({ onCreateRecinto, onCancel }) => {
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [showAddress, setShowAddress] = useState(false);
  const [details, setDetails] = useState({
    pais: '',
    estado: '',
    ciudad: '',
    codigoPostal: '',
    direccionLinea1: '',
    latitud: '',
    longitud: '',
    comoLlegar: ''
  });
  const [mapUrl, setMapUrl] = useState('');

  const handleSearchAddress = async () => {
    const full = `${details.direccionLinea1} ${direccion} ${details.ciudad} ${details.estado} ${details.pais} ${details.codigoPostal}`;
    const geo = await geocodeAddress(full);
    if (geo) {
      setDetails(prev => ({ ...prev, latitud: geo.lat, longitud: geo.lon }));
      setMapUrl(`https://www.google.com/maps?q=${geo.lat},${geo.lon}&output=embed`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateRecinto({ nombre, direccion, capacidad, ...details });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Nombre del recinto:</label>
      <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />

      <label>Dirección:</label>
      <input
        type="text"
        value={direccion}
        onChange={(e) => setDireccion(e.target.value)}
        onFocus={() => setShowAddress(true)}
        required
      />
      {showAddress && (
        <div className="mt-2 border p-2 rounded">
          <div className="grid grid-cols-1 gap-2">
            <input
              type="text"
              placeholder="País"
              value={details.pais}
              onChange={(e) => setDetails({ ...details, pais: e.target.value })}
            />
            <input
              type="text"
              placeholder="Estado"
              value={details.estado}
              onChange={(e) => setDetails({ ...details, estado: e.target.value })}
            />
            <input
              type="text"
              placeholder="Ciudad"
              value={details.ciudad}
              onChange={(e) => setDetails({ ...details, ciudad: e.target.value })}
            />
            <input
              type="text"
              placeholder="Código postal"
              value={details.codigoPostal}
              onChange={(e) => setDetails({ ...details, codigoPostal: e.target.value })}
            />
            <input
              type="text"
              placeholder="Línea de dirección 1"
              value={details.direccionLinea1}
              onChange={(e) => setDetails({ ...details, direccionLinea1: e.target.value })}
            />
            <button type="button" onClick={handleSearchAddress} className="bg-blue-500 text-white px-2 py-1 rounded">Buscar dirección</button>
            {mapUrl && (
              <iframe title="map" src={mapUrl} width="100%" height="200" allowFullScreen loading="lazy" className="mt-2" />
            )}
            <input
              type="text"
              placeholder="Cómo llegar"
              value={details.comoLlegar}
              onChange={(e) => setDetails({ ...details, comoLlegar: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Latitud"
                value={details.latitud}
                readOnly
              />
              <input
                type="text"
                placeholder="Longitud"
                value={details.longitud}
                readOnly
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => setShowAddress(false)} className="bg-green-600 text-white px-2 py-1 rounded">Validar</button>
              <button type="button" onClick={() => setShowAddress(false)} className="bg-gray-400 text-white px-2 py-1 rounded">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <label>Capacidad:</label>
      <input type="number" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} required />

      <button type="submit">Crear</button>
      <button type="button" onClick={onCancel}>Cancelar</button>
    </form>
  );
};

export default CreateRecintoForm;
