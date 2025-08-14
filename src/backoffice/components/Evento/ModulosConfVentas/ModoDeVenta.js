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
          className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer focus:outline-none transition-all duration-200 ${
            eventoData.modoVenta === 'grid' 
              ? 'border-blue-500 bg-blue-50 shadow-md' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onClick={() => handleSeleccionarModo('grid')}
        >
          <GridIcon width={48} height={48} className={`mb-2 ${eventoData.modoVenta === 'grid' ? 'opacity-100' : 'opacity-70'}`} />
          <h4 className={`font-semibold ${eventoData.modoVenta === 'grid' ? 'text-blue-700' : 'text-gray-700'}`}>Modo Grid</h4>
          <p className="text-sm text-center text-gray-600">
            Se muestra una tabla con todos los tipos de entrada.
          </p>
        </button>
        <button
          type="button"
          className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer focus:outline-none transition-all duration-200 ${
            eventoData.modoVenta === 'multi-step'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onClick={() => handleSeleccionarModo('multi-step')}
        >
          <MultiStepIcon width={48} height={48} className={`mb-2 ${eventoData.modoVenta === 'multi-step' ? 'opacity-100' : 'opacity-70'}`} />
          <h4 className={`font-semibold ${eventoData.modoVenta === 'multi-step' ? 'text-blue-700' : 'text-gray-700'}`}>Modo Multi-Step</h4>
          <p className="text-sm text-center text-gray-600">
            Recomendado para eventos multi función o múltiples zonas.
          </p>
        </button>
        <button
          type="button"
          className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer focus:outline-none transition-all duration-200 ${
            eventoData.modoVenta === 'mapa' 
              ? 'border-blue-500 bg-blue-50 shadow-md' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onClick={() => handleSeleccionarModo('mapa')}
        >
          <MapIcon width={48} height={48} className={`mb-2 ${eventoData.modoVenta === 'mapa' ? 'opacity-100' : 'opacity-70'}`} />
          <h4 className={`font-semibold ${eventoData.modoVenta === 'mapa' ? 'text-blue-700' : 'text-gray-700'}`}>Modo Mapa</h4>
          <p className="text-sm text-center text-gray-600">
            La selección de asientos se muestra antes que la de los tipos de
            precio.
          </p>
        </button>
        <button
          type="button"
          className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer focus:outline-none transition-all duration-200 ${
            eventoData.modoVenta === 'acreditacion'
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onClick={() => handleSeleccionarModo('acreditacion')}
        >
          <AccreditationIcon width={48} height={48} className={`mb-2 ${eventoData.modoVenta === 'acreditacion' ? 'opacity-100' : 'opacity-70'}`} />
          <h4 className={`font-semibold ${eventoData.modoVenta === 'acreditacion' ? 'text-blue-700' : 'text-gray-700'}`}>Solicitud de Acreditación</h4>
          <p className="text-sm text-center text-gray-600">
            Para gestionar solicitudes de acreditación para asistentes.
          </p>
        </button>
      </div>
    </div>
  );
};

export default ModoDeVenta;
