import React, { useState, useEffect } from "react";

const PopupCrearEntrada = ({ tiposDeProducto, ivas, onClose, onSave, recintoSeleccionado }) => {
  const [formData, setFormData] = useState({
    nombreEntrada: "",
    min: 1,
    max: 10,
    tipoProducto: "",
    ivaSeleccionado: "",
    recinto: recintoSeleccionado,
  });

  useEffect(() => {
    // Mantener sincronizado el recinto
    setFormData(prev => ({ ...prev, recinto: recintoSeleccionado }));
  }, [recintoSeleccionado]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "min" || name === "max"
        ? Number(value)
        : value 
    }));
  };

  const handleTipoProductoChange = (value) => {
    setFormData(prev => ({ ...prev, tipoProducto: value }));
  };

  const handleSubmit = () => {
    if (!formData.nombreEntrada) {
      alert("Debes ingresar un nombre para la entrada.");
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
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 mx-4">
        <h3 className="text-xl font-semibold mb-4 text-center">Crear Entrada</h3>

        {/* Nombre de la Entrada */}
        <input
          type="text"
          name="nombreEntrada"
          placeholder="Nombre de la Entrada"
          value={formData.nombreEntrada}
          onChange={handleChange}
          className="w-full mb-3 px-3 py-2 border rounded focus:ring-2"
        />

        {/* Cantidad Mín / Máx */}
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            name="min"
            placeholder="Cantidad Mínima"
            min="1"
            value={formData.min}
            onChange={handleChange}
            className="flex-1 px-3 py-2 border rounded focus:ring-2"
          />
          <input
            type="number"
            name="max"
            placeholder="Cantidad Máxima"
            min="1"
            value={formData.max}
            onChange={handleChange}
            className="flex-1 px-3 py-2 border rounded focus:ring-2"
          />
        </div>

        {/* Selección de IVA */}
        <label className="block font-semibold mb-1">IVA</label>
        <select
          name="ivaSeleccionado"
          value={formData.ivaSeleccionado}
          onChange={handleChange}
          className="w-full mb-4 px-3 py-2 border rounded focus:ring-2"
        >
          <option value="">Seleccionar IVA</option>
          {ivas.map(iva => (
            <option key={iva.id} value={iva.id}>
              {iva.nombre} – {iva.porcentaje}%
            </option>
          ))}
        </select>

        {/* Tipo de Producto */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Tipo de Producto</label>
          <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto border rounded p-2">
            {tiposDeProducto.map(tipo => (
              <label key={tipo.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoProducto"
                  value={tipo.value}
                  checked={formData.tipoProducto === tipo.value}
                  onChange={() => handleTipoProductoChange(tipo.value)}
                  className="accent-indigo-600"
                />
                <span>{tipo.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded">
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupCrearEntrada;
