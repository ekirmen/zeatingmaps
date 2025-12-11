import React, { useState, useEffect } from "react";

const PopupCrearEntrada = ({ tiposDeProducto, ivas, onClose, onSave, recintoSeleccionado }) => {
  const [formData, setFormData] = useState({
    nombreEntrada: "",
    min: 1,
    max: 10,
    quantityStep: "", // "Sin restricción", "2", "3", "custom"
    customQuantityStep: "", // Valor personalizado
    activoBoleteria: false,
    activoStore: false,
    tipoProducto: "",
    ivaSeleccionado: "",
    recinto: recintoSeleccionado,
  });

  useEffect(() => {
    // Mantener sincronizado el recinto
    setFormData(prev => ({ ...prev, recinto: recintoSeleccionado }));
  }, [recintoSeleccionado]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : (name === "min" || name === "max" || name === "customQuantityStep" ? Number(value) : value);
    setFormData(prev => ({ 
      ...prev, 
      [name]: newValue,
      // Si se selecciona "Sin restricción", desactivar checkboxes
      ...(name === 'quantityStep' && value === '' ? {
        activoBoleteria: false,
        activoStore: false,
        customQuantityStep: ''
      } : {})
    }));
  };

  const handleTipoProductoChange = (value) => {
    setFormData(prev => ({ ...prev, tipoProducto: value }));
  };

  const handleSubmit = () => {
    if (!formData.nombreEntrada) {

      return;
    }
    if (!formData.recinto) {
      alert("Selecciona un recinto antes de guardar.");
      return;
    }
    if (!formData.ivaSeleccionado) {
      alert("Selecciona un IVA.");
      return;
    }
    if (!formData.tipoProducto) {
      alert("Selecciona un tipo de producto.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
          <h3 className="text-2xl font-bold text-center">Crear Nueva Entrada</h3>
          <p className="text-blue-100 text-center mt-2">
            Configura los detalles de la entrada para tu recinto
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del Recinto */}
          {recintoSeleccionado && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Recinto Seleccionado</p>
                  <p className="text-sm text-blue-700">{recintoSeleccionado}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nombre de la Entrada */}
          <div className="space-y-2">
            <label className="block text-base sm:text-sm font-semibold text-gray-700">
              Nombre de la Entrada *
            </label>
            <input
              type="text"
              name="nombreEntrada"
              placeholder="Ej: Entrada General, VIP, Reducida..."
              value={formData.nombreEntrada}
              onChange={handleChange}
              className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500 min-h-[48px]"
            />
          </div>

          {/* Cantidad Mín / Máx */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-base sm:text-sm font-semibold text-gray-700">
                Cantidad Mínima *
              </label>
              <input
                type="number"
                name="min"
                placeholder="1"
                min="1"
                value={formData.min}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[48px]"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-base sm:text-sm font-semibold text-gray-700">
                Cantidad Máxima *
              </label>
              <input
                type="number"
                name="max"
                placeholder="10"
                min="1"
                value={formData.max}
                onChange={handleChange}
                className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[48px]"
              />
            </div>
          </div>

          {/* Comprar en múltiplos de */}
          <div className="space-y-2">
            <label className="block text-base sm:text-sm font-semibold text-gray-700">
              Comprar en múltiplos de:
              <span className="ml-1 text-gray-500 text-xs" title="Permite comprar 2, 4, 6... entradas. Seleccione 'Sin restricción' para desactivar la limitación.">
                <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </label>
            <select
              name="quantityStep"
              value={formData.quantityStep}
              onChange={handleChange}
              className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white appearance-none cursor-pointer min-h-[48px]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                paddingRight: '2.5rem'
              }}
            >
              <option value="">Sin restricción</option>
              <option value="2">2 en 2</option>
              <option value="3">3 en 3</option>
              <option value="custom">Personalizado</option>
            </select>
            {formData.quantityStep === 'custom' && (
              <div className="mt-3">
                <label className="block text-base sm:text-sm font-medium text-gray-700 mb-2">
                  Introducir múltiplo
                </label>
                <input
                  type="number"
                  name="customQuantityStep"
                  min="1"
                  max="999"
                  step="1"
                  placeholder="Ej: 5"
                  value={formData.customQuantityStep}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
                    setFormData(prev => ({ ...prev, customQuantityStep: value }));
                  }}
                  className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[48px]"
                />
              </div>
            )}
            {formData.quantityStep && formData.quantityStep !== '' && (
              <div className="mt-3 space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="activoBoleteria"
                    checked={formData.activoBoleteria}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Activar en boletería</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="activoStore"
                    checked={formData.activoStore}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Activar en store</span>
                </label>
              </div>
            )}
          </div>

          {/* Selección de IVA */}
          <div className="space-y-2">
            <label className="block text-base sm:text-sm font-semibold text-gray-700">
              IVA *
            </label>
            <select
              name="ivaSeleccionado"
              value={formData.ivaSeleccionado}
              onChange={handleChange}
              className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white appearance-none cursor-pointer min-h-[48px]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                paddingRight: '2.5rem'
              }}
            >
              <option value="">Seleccionar IVA</option>
              {ivas && ivas.length > 0 ? (
                ivas.map(iva => (
                  <option key={iva.id} value={iva.id}>
                    {iva.nombre} – {iva.porcentaje}%
                  </option>
                ))
              ) : (
                <option value="" disabled>No hay IVAs disponibles</option>
              )}
            </select>
            {ivas && ivas.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                No hay IVAs configurados. Contacta al administrador.
              </p>
            )}
          </div>

          {/* Tipo de Producto */}
          <div className="space-y-3">
            <label className="block text-base sm:text-sm font-semibold text-gray-700">
              Tipo de Producto *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              {tiposDeProducto.map(tipo => (
                <label 
                  key={tipo.value} 
                  className={`flex items-start gap-3 p-3 sm:p-2.5 rounded-lg border-2 cursor-pointer transition-all hover:bg-white hover:border-blue-300 ${
                    formData.tipoProducto === tipo.value 
                      ? 'bg-blue-50 border-blue-500' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="tipoProducto"
                    value={tipo.value}
                    checked={formData.tipoProducto === tipo.value}
                    onChange={() => handleTipoProductoChange(tipo.value)}
                    className="mt-1 accent-blue-600 w-5 h-5 sm:w-4 sm:h-4"
                  />
                  <div className="flex-1">
                    <span className="block text-base sm:text-sm font-medium text-gray-900">
                      {tipo.label}
                    </span>
                    <span className="block text-sm sm:text-xs text-gray-600 mt-1">
                      {tipo.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Validaciones */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-yellow-600 mt-0.5">⚠️</div>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Campos obligatorios:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Nombre de la entrada</li>
                  <li>Cantidad mínima y máxima</li>
                  <li>IVA</li>
                  <li>Tipo de producto</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 rounded-b-xl border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button 
              onClick={onClose} 
              className="px-6 py-3.5 sm:py-3 text-base sm:text-sm border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium min-h-[48px]"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit} 
              className="px-6 py-3.5 sm:py-3 text-base sm:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm min-h-[48px]"
            >
              Crear Entrada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupCrearEntrada;
