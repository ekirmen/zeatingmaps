import React, { useState } from 'react';

const RegistroObligatorio = ({ eventoData, setEventoData }) => {
  const [form, setForm] = useState({
    forzarRegistro: eventoData?.forzarRegistro ?? false,
    maxTicketsCompra: eventoData?.maxTicketsCompra ?? 10,
    maxEntradasEmail: eventoData?.maxEntradasEmail ?? 0,
    mostrarPrecioMinimo: eventoData?.mostrarPrecioMinimo ?? false,
    mostrarPrecioDesdeConComision: eventoData?.mostrarPrecioDesdeConComision ?? false,
    mostrarPrecioDesdeSinComision: eventoData?.mostrarPrecioDesdeSinComision ?? false,
    eventoSinLanding: eventoData?.eventoSinLanding ?? false,
    forzarFlujoPromociones: eventoData?.forzarFlujoPromociones ?? false,
    eventoSinFecha: eventoData?.eventoSinFecha ?? false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setForm(prev => ({ ...prev, [name]: newValue }));
    setEventoData(prev => ({ ...prev, [name]: newValue }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Registro Obligatorio antes de la Selección de Entradas</h3>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="forzarRegistro"
          checked={form.forzarRegistro}
          onChange={handleChange}
        />
        Forzar el registro
      </label>

      <h4 className="font-semibold">Opciones</h4>
      <div className="flex flex-col gap-2">
        <label>
          Max tickets compra
          <input
            type="number"
            name="maxTicketsCompra"
            value={form.maxTicketsCompra}
            onChange={handleChange}
            className="ml-2 border p-1"
          />
        </label>
        <label>
          Max entradas / email
          <input
            type="number"
            name="maxEntradasEmail"
            value={form.maxEntradasEmail}
            onChange={handleChange}
            className="ml-2 border p-1"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="mostrarPrecioMinimo"
            checked={form.mostrarPrecioMinimo}
            onChange={handleChange}
          />
          Mostrar precio mínimo
        </label>
        {form.mostrarPrecioMinimo && (
          <div className="flex flex-col ml-4 gap-1">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="precioDesdeOption"
                value="con"
                checked={form.mostrarPrecioDesdeConComision}
                onChange={() => {
                  setForm(prev => ({
                    ...prev,
                    mostrarPrecioDesdeConComision: true,
                    mostrarPrecioDesdeSinComision: false
                  }));
                  setEventoData(prev => ({
                    ...prev,
                    mostrarPrecioDesdeConComision: true,
                    mostrarPrecioDesdeSinComision: false
                  }));
                }}
              />
              Mostrar el 'precio desde' con la comisión
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="precioDesdeOption"
                value="sin"
                checked={form.mostrarPrecioDesdeSinComision}
                onChange={() => {
                  setForm(prev => ({
                    ...prev,
                    mostrarPrecioDesdeConComision: false,
                    mostrarPrecioDesdeSinComision: true
                  }));
                  setEventoData(prev => ({
                    ...prev,
                    mostrarPrecioDesdeConComision: false,
                    mostrarPrecioDesdeSinComision: true
                  }));
                }}
              />
              Mostrar el 'precio desde' sin comisión
            </label>
          </div>
        )}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="eventoSinLanding"
            checked={form.eventoSinLanding}
            onChange={handleChange}
          />
          Evento sin landing page
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="forzarFlujoPromociones"
            checked={form.forzarFlujoPromociones}
            onChange={handleChange}
          />
          Forzar flujo de promociones
        </label>
      </div>

      <h4 className="font-semibold">Fechas</h4>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="eventoSinFecha"
          checked={form.eventoSinFecha}
          onChange={handleChange}
        />
        Evento sin fecha
      </label>
    </div>
  );
};

export default RegistroObligatorio;
