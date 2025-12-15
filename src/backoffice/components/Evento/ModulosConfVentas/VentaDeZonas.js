import React, { useState } from 'react';

const VentaDeZonas = () => {
  const [modo, setModo] = useState('indicador');
  const [graficoOption, setGraficoOption] = useState('asientos');
  const [asientosMostrar, setAsientosMostrar] = useState('siempre');
  const [asientosUmbral, setAsientosUmbral] = useState('0');
  const [porcentajeMostrar, setPorcentajeMostrar] = useState('siempre');
  const [porcentajeUmbral, setPorcentajeUmbral] = useState('0');
  const [mostrarAforoTotal, setMostrarAforoTotal] = useState(false);
  const [ocultarPrecioDesde, setOcultarPrecioDesde] = useState(false);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Venta de Zonas</h3>
      <p>Selecciona el modo que más se ajuste a tus preferencias de venta.</p>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="modoVentaZonas"
            checked={modo === 'indicador'}
            onChange={() => setModo('indicador')}
          />
          Modo indicador de ocupación
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="modoVentaZonas"
            checked={modo === 'grafico'}
            onChange={() => setModo('grafico')}
          />
          Modo gráfico circunferencia
        </label>

        {modo === 'grafico' && (
          <div className="ml-4 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="graficoOption"
                checked={graficoOption === 'asientos'}
                onChange={() => setGraficoOption('asientos')}
              />
              Mostrar asientos disponibles
            </label>

            {graficoOption === 'asientos' && (
              <div className="ml-4 flex flex-col gap-1">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="asientosOption"
                    checked={asientosMostrar === 'siempre'}
                    onChange={() => setAsientosMostrar('siempre')}
                  />
                  Mostrar siempre
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="asientosOption"
                    checked={asientosMostrar === 'umbral'}
                    onChange={() => setAsientosMostrar('umbral')}
                  />
                  Mostrar solo si quedan menos de
                  <input
                    type="number"
                    value={asientosUmbral}
                    onChange={e => setAsientosUmbral(e.target.value)}
                    className="ml-2 border p-1 w-16"
                  />
                  asientos libres por zona
                </label>
              </div>
            )}

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="graficoOption"
                checked={graficoOption === 'porcentaje'}
                onChange={() => setGraficoOption('porcentaje')}
              />
              Mostrar porcentaje de ocupación
            </label>

            {graficoOption === 'porcentaje' && (
              <div className="ml-4 flex flex-col gap-1">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="porcentajeOption"
                    checked={porcentajeMostrar === 'siempre'}
                    onChange={() => setPorcentajeMostrar('siempre')}
                  />
                  Mostrar siempre
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="porcentajeOption"
                    checked={porcentajeMostrar === 'umbral'}
                    onChange={() => setPorcentajeMostrar('umbral')}
                  />
                  Mostrar solo si quedan menos de
                  <input
                    type="number"
                    value={porcentajeUmbral}
                    onChange={e => setPorcentajeUmbral(e.target.value)}
                    className="ml-2 border p-1 w-16"
                  />
                  % Selección de asientos libres por zona
                </label>
              </div>
            )}
          </div>
        )}

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="modoVentaZonas"
            checked={modo === 'simple'}
            onChange={() => setModo('simple')}
          />
          Modo simple
        </label>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={mostrarAforoTotal}
          onChange={e => setMostrarAforoTotal(e.target.checked)}
        />
        Mostrar aforo total de las zonas
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={ocultarPrecioDesde}
          onChange={e => setOcultarPrecioDesde(e.target.checked)}
        />
        No mostrar el "precio desde" en los botones de selección de zonas
      </label>
    </div>
  );
};

export default VentaDeZonas;
