import React from 'react';
import { Button, Switch } from 'antd';

const TopControls = ({
  showGrid,
  setShowGrid,
  snapToGrid,
  setSnapToGrid,
  selectedElements,
  deleteSelected,
  enterZoneMode,
  selectedElement,
  isInZoneMode,
  exitZoneMode
}) => {
  return (
    <div className="top-controls">
      <div className="control-label">Eliminar obsoletos</div>
      <div className="control-group">
        <Switch
          checked={showGrid}
          onChange={setShowGrid}
        />
        <Button 
          type="primary"
          onClick={() => {
            // Función para sincronizar seats
            console.log('Sincronizando seats...');
          }}
        >
          Sincronizar seats
        </Button>
        <Button 
          onClick={() => {
            // Función para crear mesa de prueba
            console.log('Creando mesa de prueba...');
          }}
        >
          Crear Mesa Prueba
        </Button>
        <Button 
          onClick={() => {
            // Función para debug
            console.log('Debug elementos:', selectedElements);
          }}
        >
          🐛 Debug Elementos
        </Button>
      </div>
    </div>
  );
};

export default TopControls;
