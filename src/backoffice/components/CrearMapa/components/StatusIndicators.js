import React from 'react';
import { Button } from 'antd';

const StatusIndicators = ({
  lastSavedAt,
  numerationMode,
  activateNumerationMode,
  isInZoneMode,
  selectedZone,
  exitZoneMode
}) => {
  return (
    <>
      {/* Estado de guardado */}
      {lastSavedAt && (
        <div className="saving-status-left">
          <span>✅ Mapa guardado: {lastSavedAt.toLocaleTimeString()}</span>
        </div>
      )}

      {/* Indicador de modo numeración */}
      {numerationMode && (
        <div className="numeration-mode-indicator">
          <span>🔢 Modo Numeración: {
            numerationMode === 'seats' ? 'Asientos' : 
            numerationMode === 'tables' ? 'Mesas' : 
            'Filas'
          }</span>
          <Button 
            size="small" 
            onClick={() => activateNumerationMode(numerationMode)} 
            style={{ marginLeft: '1rem' }}
          >
            ❌ Desactivar
          </Button>
        </div>
      )}

      {/* Indicador de modo zona */}
      {isInZoneMode && selectedZone && (
        <div className="zone-mode-indicator">
          <span>🏗️ Modo Zona: {selectedZone}</span>
          <Button 
            size="small" 
            onClick={exitZoneMode} 
            style={{ marginLeft: '1rem' }}
          >
            🚪 Salir
          </Button>
        </div>
      )}
    </>
  );
};

export default StatusIndicators;
