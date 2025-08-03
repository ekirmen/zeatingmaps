import React, { useState, useEffect } from 'react';
import { NotificationManager } from 'react-notifications';
import { geocodeAddress } from '../../utils/geocode';
import buildAddress from '../../utils/address';
import { supabase } from '../../supabaseClient';

const EditRecintoForm = ({ recinto, onEditRecinto, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    capacidad: '',
    pais: '',
    estado: '',
    ciudad: '',
    codigopostal: '',
    direccionlinea1: '',
    latitud: '',
    longitud: '',
    comollegar: ''
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
        codigopostal: recinto.codigopostal || '',
        direccionlinea1: recinto.direccionlinea1 || '',
        latitud: recinto.latitud || '',
        longitud: recinto.longitud || '',
        comollegar: recinto.comollegar || ''
      });
    }
  }, [recinto]);

  const handleSearchAddress = async () => {
    const full = buildAddress(formData);
    const geo = await geocodeAddress(full);
    if (geo) {
      setFormData(prev => ({ ...prev, latitud: geo.lat, longitud: geo.lon, direccion: full }));
      setMapUrl(`https://www.google.com/maps?q=${geo.lat},${geo.lon}&output=embed`);
    } else {
      setFormData(prev => ({ ...prev, direccion: full }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      direccion: buildAddress(formData)
    };

    const { error } = await supabase
      .from('recintos')
      .update(payload)
      .eq('id', recinto.id);

    if (error) {
      console.error('Error al actualizar:', error.message);
      NotificationManager.error(`Error: ${error.message}`);
    } else {
      NotificationManager.success('Recinto actualizado con éxito');
      onEditRecinto(); // Para que el padre actualice los datos
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Editar Recinto</h2>
      <label>Nombre:</label>
      <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />

      <label>Dirección:</label>
      <input
        type="text"
        value={buildAddress(formData)}
        readOnly
        onFocus={() => setShowAddress(true)}
        placeholder="Completa los detalles"
      />
      {showAddress && (
        <div className="mt-2 border p-2 rounded">
          <input type="text" placeholder="País" value={formData.pais} onChange={(e) => setFormData({ ...formData, pais: e.target.value })} />
          <input type="text" placeholder="Estado" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} />
          <input type="text" placeholder="Ciudad" value={formData.ciudad} onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })} />
          <input type="text" placeholder="Código postal" value={formData.codigopostal} onChange={(e) => setFormData({ ...formData, codigopostal: e.target.value })} />
          <input type="text" placeholder="Dirección línea 1" value={formData.direccionlinea1} onChange={(e) => setFormData({ ...formData, direccionlinea1: e.target.value })} />
          <button type="button" onClick={handleSearchAddress}>Buscar dirección</button>
          {mapUrl && <iframe title="map" src={mapUrl} width="100%" height="200" allowFullScreen loading="lazy" className="mt-2" />}
          <input type="text" placeholder="Cómo llegar" value={formData.comollegar} onChange={(e) => setFormData({ ...formData, comollegar: e.target.value })} />
          <input type="text" placeholder="Latitud" value={formData.latitud} readOnly />
          <input type="text" placeholder="Longitud" value={formData.longitud} readOnly />
          <button type="button" onClick={() => setShowAddress(false)}>Validar</button>
          <button type="button" onClick={() => setShowAddress(false)}>Cancelar</button>
        </div>
      )}

      <label>Capacidad:</label>
      <input type="number" value={formData.capacidad} onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })} />

      <div className="mt-4 flex gap-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Actualizar Recinto</button>
        <button type="button" onClick={onCancel} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
      </div>
    </form>
  );
};

export default EditRecintoForm;
