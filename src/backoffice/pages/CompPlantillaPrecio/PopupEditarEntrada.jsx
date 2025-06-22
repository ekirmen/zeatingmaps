import React from "react";

const PopupEditarEntrada = ({ tiposDeProducto, ivas, formData, onClose, onSave, onFormChange }) => {

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFormChange({ ...formData, [name]: value });
  };

  const handleTipoChange = (value) => {
    onFormChange({ ...formData, tipo: value });
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 mx-4">
        <h3 className="text-xl font-semibold mb-4 text-center">Editar Ticket</h3>

        <input
          type="text"
          name="evento_id"
          placeholder="ID del Evento"
          value={formData.evento_id}
          onChange={handleChange}
          className="w-full mb-3 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="text"
          name="tipoEntrada"
          placeholder="Tipo de Entrada"
          value={formData.tipoEntrada}
          onChange={handleChange}
          className="w-full mb-3 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="text"
          name="producto"
          placeholder="Nombre del Producto"
          value={formData.producto}
          onChange={handleChange}
          className="w-full mb-3 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="number"
          name="precio"
          placeholder="Precio"
          min="0"
          value={formData.precio}
          onChange={handleChange}
          className="w-full mb-3 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="number"
          name="cantidad"
          placeholder="Cantidad"
          min="0"
          value={formData.cantidad}
          onChange={handleChange}
          className="w-full mb-3 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="flex gap-2 mb-3">
          <input
            type="number"
            name="min"
            placeholder="Cantidad Mínima"
            min="1"
            value={formData.min}
            onChange={handleChange}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number"
            name="max"
            placeholder="Cantidad Máxima"
            min="1"
            value={formData.max}
            onChange={handleChange}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <label className="block font-semibold mb-1">IVA</label>
        <select
          name="ivaSeleccionado"
          value={formData.ivaSeleccionado}
          onChange={handleChange}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Seleccionar IVA</option>
          {ivas.map(iva => (
            <option key={iva.id} value={iva.id}>
              {iva.nombre} - {iva.porcentaje}%
            </option>
          ))}
        </select>

        {formData.ivaSeleccionado && (
          <div className="mb-4 p-3 border border-indigo-200 rounded bg-indigo-50 text-indigo-700">
            <p><strong>IVA Seleccionado:</strong></p>
            {ivas
              .filter(iva => iva.id === formData.ivaSeleccionado)
              .map(iva => (
                <p key={iva.id}>
                  {iva.nombre} - {iva.porcentaje}%
                </p>
              ))}
          </div>
        )}

        <div className="mb-4">
          <p className="block font-semibold mb-2">Tipo de Producto</p>
          <div className="flex flex-wrap gap-3 max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
            {tiposDeProducto.map(tipo => (
              <label
                key={tipo.value}
                className="flex items-center gap-2 cursor-pointer select-none"
                title={tipo.description}
              >
                <input
                  type="radio"
                  name="tipo"
                  value={tipo.value}
                  checked={formData.tipo === tipo.value}
                  onChange={() => handleTipoChange(tipo.value)}
                  className="accent-indigo-600"
                />
                <span className="text-gray-700">{tipo.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupEditarEntrada;
