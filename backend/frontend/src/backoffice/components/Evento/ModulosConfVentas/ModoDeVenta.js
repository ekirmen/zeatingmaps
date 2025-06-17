import React from 'react';
import { ReactComponent as GridIcon } from './svg/grid.svg';
import { ReactComponent as MultiStepIcon } from './svg/manual.svg';
import { ReactComponent as MapIcon } from './svg/map_first.svg';
import { ReactComponent as AccreditationIcon } from './svg/accreditation.svg';

const ModoDeVenta = ({ eventoData, setEventoData }) => {
  const handleSeleccionarModo = (modo) => {
    setEventoData((prevData) => ({
      ...prevData,
      modoVenta: modo,
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Modo de venta</h3>
      <p>
        Selecciona el método que mejor cuadra con tu tipo de venta. Si tu evento
        es numerado o no numerado, si tienes diferentes fechas o incluso
        dependiendo de tu tipo de usuario, uno de los modos debe encajar mejor con
        tus necesidades de venta.
      </p>
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          className={`flex flex-col items-center p-4 border rounded cursor-pointer focus:outline-none ${
            eventoData.modoVenta === 'grid' ? 'border-blue-500' : 'border-gray-300'
          }`}
          onClick={() => handleSeleccionarModo('grid')}
        >
          <GridIcon width={48} height={48} className="mb-2" />
          <h4 className="font-semibold">Modo Grid</h4>
          <p className="text-sm text-center">
            Se muestra una tabla con todos los tipos de entrada.
          </p>
        </button>
        <button
          type="button"
          className={`flex flex-col items-center p-4 border rounded cursor-pointer focus:outline-none ${
            eventoData.modoVenta === 'multi-step'
              ? 'border-blue-500'
              : 'border-gray-300'
          }`}
          onClick={() => handleSeleccionarModo('multi-step')}
        >
          <MultiStepIcon width={48} height={48} className="mb-2" />
          <h4 className="font-semibold">Modo Multi-Step</h4>
          <p className="text-sm text-center">
            Recomendado para eventos multi función o múltiples zonas.
          </p>
        </button>
        <button
          type="button"
          className={`flex flex-col items-center p-4 border rounded cursor-pointer focus:outline-none ${
            eventoData.modoVenta === 'mapa' ? 'border-blue-500' : 'border-gray-300'
          }`}
          onClick={() => handleSeleccionarModo('mapa')}
        >
          <MapIcon width={48} height={48} className="mb-2" />
          <h4 className="font-semibold">Modo Mapa</h4>
          <p className="text-sm text-center">
            La selección de asientos se muestra antes que la de los tipos de
            precio.
          </p>
        </button>
        <button
          type="button"
          className={`flex flex-col items-center p-4 border rounded cursor-pointer focus:outline-none ${
            eventoData.modoVenta === 'acreditacion'
              ? 'border-blue-500'
              : 'border-gray-300'
          }`}
          onClick={() => handleSeleccionarModo('acreditacion')}
        >
          <AccreditationIcon width={48} height={48} className="mb-2" />
          <h4 className="font-semibold">Solicitud de Acreditación</h4>
          <p className="text-sm text-center">
            Para gestionar solicitudes de acreditación para asistentes.
          </p>
        </button>
      </div>
    </div>
  );
};

export default ModoDeVenta;
