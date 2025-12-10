import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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
    codigoPostal: '',
    direccionLinea1: '',
    latitud: '',
    longitud: '',
    comollegar: ''
  });

  const [showAddress, setShowAddress] = useState(false);
  const [mapUrl, setMapUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (recinto) {
      setFormData({
        nombre: recinto.nombre || '',
        direccion: recinto.direccion || '',
        capacidad: recinto.capacidad || '',
        pais: recinto.pais || '',
        estado: recinto.estado || '',
        ciudad: recinto.ciudad || '',
        codigoPostal: recinto.codigoPostal || recinto.codigopostal || '',
        direccionLinea1: recinto.direccionLinea1 || recinto.direccionlinea1 || '',
        latitud: recinto.latitud || '',
        longitud: recinto.longitud || '',
        comollegar: recinto.comollegar || ''
      });

      if (recinto.latitud && recinto.longitud) {
        setMapUrl(`https://www.google.com/maps?q=${recinto.latitud},${recinto.longitud}&output=embed`);
      } else if (recinto.direccion) {
        setMapUrl(`https://www.google.com/maps?q=${encodeURIComponent(recinto.direccion)}&output=embed`);
      }
    }
  }, [recinto]);

  const handleSearchAddress = async () => {
    try {
      const full = buildAddress(formData);
      const geo = await geocodeAddress(full);
      if (geo) {
        setFormData(prev => ({
          ...prev,
          latitud: geo.lat,
          longitud: geo.lon,
          direccion: full
        }));
        setMapUrl(`https://www.google.com/maps?q=${geo.lat},${geo.lon}&output=embed`);
      } else {
        setFormData(prev => ({ ...prev, direccion: full }));
        setMapUrl(`https://www.google.com/maps?q=${encodeURIComponent(full)}&output=embed`);
      }
    } catch (error) {
      console.error('Error al geocodificar:', error);
      NotificationManager.warning('No se pudo obtener las coordenadas de la dirección');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validar campos requeridos
      if (!formData.nombre.trim()) {
        throw new Error('El nombre del recinto es obligatorio');
      }

      if (!formData.capacidad || formData.capacidad <= 0) {
        throw new Error('La capacidad debe ser mayor a 0');
      }

      const payload = {
        nombre: formData.nombre.trim(),
        capacidad: parseInt(formData.capacidad),
        direccion: buildAddress(formData),
        pais: formData.pais.trim() || null,
        estado: formData.estado.trim() || null,
        ciudad: formData.ciudad.trim() || null,
        codigopostal: formData.codigoPostal.trim() || null,
        direccionlinea1: formData.direccionLinea1.trim() || null,
        latitud: formData.latitud ? parseFloat(formData.latitud) : null,
        longitud: formData.longitud ? parseFloat(formData.longitud) : null,
        comollegar: formData.comollegar.trim() || null,
        updated_at: new Date().toISOString()
      };

      // Filtrar campos vacíos
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== null && value !== '')
      );

      const { error } = await supabase
        .from('recintos')
        .update(cleanPayload)
        .eq('id', recinto.id);

      if (error) {
        throw new Error(error.message);
      }

      NotificationManager.success('Recinto actualizado con éxito');
      onEditRecinto();
    } catch (error) {
      console.error('Error al actualizar:', error);
      NotificationManager.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900">Editar Recinto</h3>
        <p className="text-sm text-gray-500 mt-1">Actualiza la información del recinto</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Recinto *
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Ingresa el nombre del recinto"
            required
          />
        </div>

        {/* Capacidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capacidad *
          </label>
          <input
            type="number"
            value={formData.capacidad}
            onChange={(e) => handleInputChange('capacidad', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Número de asientos disponibles"
            min="1"
            required
          />
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección Completa
          </label>
          <input
            type="text"
            value={buildAddress(formData)}
            readOnly
            onFocus={() => setShowAddress(true)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer"
            placeholder="Haz clic para completar la dirección"
          />
        </div>

        {/* Detalles de Dirección */}
        {showAddress && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Detalles de Dirección</h4>
              <button
                type="button"
                onClick={() => setShowAddress(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">País</label>
                <input
                  type="text"
                  placeholder="País"
                  value={formData.pais}
                  onChange={(e) => handleInputChange('pais', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estado/Provincia</label>
                <input
                  type="text"
                  placeholder="Estado"
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad</label>
                <input
                  type="text"
                  placeholder="Ciudad"
                  value={formData.ciudad}
                  onChange={(e) => handleInputChange('ciudad', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Código Postal</label>
                                 <input
                   type="text"
                   placeholder="Código postal"
                   value={formData.codigoPostal}
                   onChange={(e) => handleInputChange('codigoPostal', e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                 />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dirección Línea 1</label>
                             <input
                 type="text"
                 placeholder="Calle, número, piso, etc."
                 value={formData.direccionLinea1}
                 onChange={(e) => handleInputChange('direccionLinea1', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
               />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Instrucciones de Llegada</label>
              <textarea
                placeholder="Instrucciones adicionales para llegar al recinto"
                value={formData.comollegar}
                onChange={(e) => handleInputChange('comollegar', e.target.value)}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
              />
            </div>

            {/* Botón de búsqueda de coordenadas */}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleSearchAddress}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar Coordenadas
              </button>
            </div>

            {/* Coordenadas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Latitud</label>
                <input
                  type="text"
                  placeholder="Latitud"
                  value={formData.latitud}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Longitud</label>
                <input
                  type="text"
                  placeholder="Longitud"
                  value={formData.longitud}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-sm"
                />
              </div>
            </div>

            {/* Mapa */}
            {mapUrl && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">Ubicación en el Mapa</label>
                <div className="border border-gray-300 rounded-md overflow-hidden">
                  <iframe
                    title="Ubicación del recinto"
                    src={mapUrl}
                    width="100%"
                    height="200"
                    allowFullScreen
                    loading="lazy"
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Actualizando...
              </>
            ) : (
              'Actualizar Recinto'
            )}
          </button>
        </div>
      </form>

    </div>
  );
};

export default EditRecintoForm;
