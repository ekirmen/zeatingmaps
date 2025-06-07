import React from 'react';
import './ModoDeVenta.css';
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
    <div className="modo-de-venta">
      <h3>Modo de Venta</h3>
      <p>Selecciona el método que mejor se ajusta a tu tipo de venta.</p>
      <div className="modo-venta-options">
        <div
          className={`modo-option ${eventoData.modoVenta === 'grid' ? 'selected' : ''}`}
          onClick={() => handleSeleccionarModo('grid')}
        >
          <GridIcon width={48} height={48} />
          <h4>Modo Grid</h4>
          <p>Se muestra una tabla con todos los tipos de entrada.</p>
        </div>
        <div
          className={`modo-option ${eventoData.modoVenta === 'multi-step' ? 'selected' : ''}`}
          onClick={() => handleSeleccionarModo('multi-step')}
        >
          <MultiStepIcon width={48} height={48} />
          <h4>Modo Multi-Step</h4>
          <p>Recomendado para eventos multi función o múltiples zonas.</p>
        </div>
        <div
          className={`modo-option ${eventoData.modoVenta === 'mapa' ? 'selected' : ''}`}
          onClick={() => handleSeleccionarModo('mapa')}
        >
          <MapIcon width={48} height={48} />
          <h4>Modo Mapa</h4>
          <p>La selección de asientos se muestra antes que la de los tipos de precio.</p>
        </div>
        <div
          className={`modo-option ${eventoData.modoVenta === 'acreditacion' ? 'selected' : ''}`}
          onClick={() => handleSeleccionarModo('acreditacion')}
        >
          <AccreditationIcon width={48} height={48} />
          <h4>Solicitud de Acreditación</h4>
          <p>Para gestionar solicitudes de acreditación para asistentes.</p>
        </div>
      </div>
    </div>
  );
};

export default ModoDeVenta;
