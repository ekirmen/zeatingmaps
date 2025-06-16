import React, { useState, useEffect } from 'react';
import { NotificationManager } from 'react-notifications';

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

const EditRecintoForm = ({ recinto, onEditRecinto, onCancel }) => {  // Changed from onUpdateRecinto to onEditRecinto
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    capacidad: '',
    pais: '',
    estado: '',
    ciudad: '',
    codigoPostal: '',
    direccionLinea1: '',
    latitud: '',
    longitud: '',
    comoLlegar: ''
  });
  const [showAddress, setShowAddress] = useState(false);
  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    if (recinto) {
      setFormData({
        nombre: recinto.nombre,
        direccion: recinto.direccion,
        capacidad: recinto.capacidad,
        pais: recinto.pais || '',
        estado: recinto.estado || '',
        ciudad: recinto.ciudad || '',
        codigoPostal: recinto.codigoPostal || '',
        direccionLinea1: recinto.direccionLinea1 || '',
        latitud: recinto.latitud || '',
        longitud: recinto.longitud || '',
        comoLlegar: recinto.comoLlegar || ''
      });
    }
  }, [recinto]);

  const handleSearchAddress = async () => {
    const full = `${formData.direccionLinea1} ${formData.direccion} ${formData.ciudad} ${formData.estado} ${formData.pais} ${formData.codigoPostal}`;
    const geo = await geocodeAddress(full);
    if (geo) {
      setFormData(prev => ({ ...prev, latitud: geo.lat, longitud: geo.lon }));
      setMapUrl(`https://www.google.com/maps?q=${geo.lat},${geo.lon}&output=embed`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`http://localhost:5000/api/recintos/${recinto._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error desconocido');
      }

      const updatedRecinto = await response.json();
      onEditRecinto(updatedRecinto);  // Changed from onUpdateRecinto to onEditRecinto
      NotificationManager.success('Recinto actualizado con éxito');
    } catch (error) {
      console.error('Error al actualizar el recinto:', error);
      NotificationManager.error(`Error al actualizar el recinto: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Editar Recinto</h2>
      <div>
        <label>
          Nombre:
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />
        </label>
      </div>
      <div>
        <label>
          Dirección:
          <input
            type="text"
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            onFocus={() => setShowAddress(true)}
          />
        </label>
        {showAddress && (
          <div className="mt-2 border p-2 rounded">
            <div className="grid grid-cols-1 gap-2">
              <input type="text" placeholder="País" value={formData.pais} onChange={(e) => setFormData({ ...formData, pais: e.target.value })} />
              <input type="text" placeholder="Estado" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} />
              <input type="text" placeholder="Ciudad" value={formData.ciudad} onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })} />
              <input type="text" placeholder="Código postal" value={formData.codigoPostal} onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })} />
              <input type="text" placeholder="Línea de dirección 1" value={formData.direccionLinea1} onChange={(e) => setFormData({ ...formData, direccionLinea1: e.target.value })} />
              <button type="button" onClick={handleSearchAddress} className="bg-blue-500 text-white px-2 py-1 rounded">Buscar dirección</button>
              {mapUrl && (
                <iframe title="map" src={mapUrl} width="100%" height="200" allowFullScreen loading="lazy" className="mt-2" />
              )}
              <input type="text" placeholder="Cómo llegar" value={formData.comoLlegar} onChange={(e) => setFormData({ ...formData, comoLlegar: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Latitud" value={formData.latitud} readOnly />
                <input type="text" placeholder="Longitud" value={formData.longitud} readOnly />
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setShowAddress(false)} className="bg-green-600 text-white px-2 py-1 rounded">Validar</button>
                <button type="button" onClick={() => setShowAddress(false)} className="bg-gray-400 text-white px-2 py-1 rounded">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div>
        <label>
          Capacidad:
          <input
            type="number"
            value={formData.capacidad}
            onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
          />
        </label>
      </div>
      <button type="submit">Actualizar Recinto</button>
      <button type="button" onClick={onCancel}>Cancelar</button>
    </form>
  );
};

export default EditRecintoForm;
