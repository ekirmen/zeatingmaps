import React, { useState, useEffect } from 'react';

const RegistroObligatorio = ({ eventoData, setEventoData }) => {
  const [form, setForm] = useState({
    forzarRegistro: false,
    maxTicketsCompra: 10,
    maxEntradasEmail: 0,
    mostrarPrecioMinimo: false,
    mostrarPrecioDesdeConComision: false,
    mostrarPrecioDesdeSinComision: false,
    eventoSinLanding: false,
    forzarFlujoPromociones: false,
    eventoSinFecha: false
  });

  // Cargar datos desde eventoData cuando cambie
  useEffect(() => {
    if (eventoData) {
      setForm({
        forzarRegistro: eventoData.forzarRegistro ?? false,
        maxTicketsCompra: eventoData.maxTicketsCompra ?? 10,
        maxEntradasEmail: eventoData.maxEntradasEmail ?? 0,
        mostrarPrecioMinimo: eventoData.mostrarPrecioMinimo ?? false,
        mostrarPrecioDesdeConComision: eventoData.mostrarPrecioDesdeConComision ?? false,
        mostrarPrecioDesdeSinComision: eventoData.mostrarPrecioDesdeSinComision ?? false,
        eventoSinLanding: eventoData.eventoSinLanding ?? false,
        forzarFlujoPromociones: eventoData.forzarFlujoPromociones ?? false,
        eventoSinFecha: eventoData.eventoSinFecha ?? false
      });
    }
  }, [eventoData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    const updatedForm = { ...form, [name]: newValue };
    setForm(updatedForm);
    setEventoData(prev => ({ ...prev, [name]: newValue }));
  };

  return (
    <div className="registro-obligatorio space-y-6 bg-white p-6 rounded-lg border border-gray-200">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Registro Obligatorio antes de la Selección de Entradas</h3>
        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <input
            type="checkbox"
            name="forzarRegistro"
            checked={form.forzarRegistro}
            onChange={handleChange}
            className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700">Forzar el registro</span>
        </label>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Opciones</h4>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-medium text-gray-700 sm:min-w-[200px] block sm:block">
              Max tickets compra
            </label>
            <input
              type="number"
              name="maxTicketsCompra"
              value={form.maxTicketsCompra}
              onChange={handleChange}
              className="flex-1 max-w-xs px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              min="1"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-medium text-gray-700 sm:min-w-[200px] block sm:block">
              Max entradas / email
            </label>
            <input
              type="number"
              name="maxEntradasEmail"
              value={form.maxEntradasEmail}
              onChange={handleChange}
              className="flex-1 max-w-xs px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              min="0"
            />
          </div>
          
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <input
              type="checkbox"
              name="mostrarPrecioMinimo"
              checked={form.mostrarPrecioMinimo}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">Mostrar precio mínimo</span>
          </label>
          
          {form.mostrarPrecioMinimo && (
            <div className="ml-8 space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="precioDesdeOption"
                  value="con"
                  checked={form.mostrarPrecioDesdeConComision}
                  onChange={() => {
                    const updatedForm = {
                      ...form,
                      mostrarPrecioDesdeConComision: true,
                      mostrarPrecioDesdeSinComision: false
                    };
                    setForm(updatedForm);
                    setEventoData(prev => ({
                      ...prev,
                      mostrarPrecioDesdeConComision: true,
                      mostrarPrecioDesdeSinComision: false
                    }));
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700">Mostrar el 'precio desde' con la comisión</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="precioDesdeOption"
                  value="sin"
                  checked={form.mostrarPrecioDesdeSinComision}
                  onChange={() => {
                    const updatedForm = {
                      ...form,
                      mostrarPrecioDesdeConComision: false,
                      mostrarPrecioDesdeSinComision: true
                    };
                    setForm(updatedForm);
                    setEventoData(prev => ({
                      ...prev,
                      mostrarPrecioDesdeConComision: false,
                      mostrarPrecioDesdeSinComision: true
                    }));
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700">Mostrar el 'precio desde' sin comisión</span>
              </label>
            </div>
          )}
          
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <input
              type="checkbox"
              name="eventoSinLanding"
              checked={form.eventoSinLanding}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">Evento sin landing page</span>
          </label>
          
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <input
              type="checkbox"
              name="forzarFlujoPromociones"
              checked={form.forzarFlujoPromociones}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">Forzar flujo de promociones</span>
          </label>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Fechas</h4>
        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <input
            type="checkbox"
            name="eventoSinFecha"
            checked={form.eventoSinFecha}
            onChange={handleChange}
            className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700">Evento sin fecha</span>
        </label>
      </div>
    </div>
  );
};

export default RegistroObligatorio;
