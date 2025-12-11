import React from 'react';
import { Progress, Spin, Card } from '../utils/antdComponents';
import { LoadingOutlined } from '@ant-design/icons';

/**
 * Componente de barra de progreso para la carga del mapa
 */
const MapLoadingProgress = ({ 
  loading = false, 
  progress = 0, 
  stage = 'inicializando',
  showDetails = true 
}) => {

    return null;
  }

  const stageMessages = {
    inicializando: 'Inicializando mapa...',
    cargandoDatos: 'Cargando datos del mapa...',
    cargandoImagen: 'Cargando imagen de fondo...',
    cargandoAsientos: 'Cargando asientos...',
    finalizando: 'Finalizando carga...'
  };

  const stageMessage = stageMessages[stage] || 'Cargando mapa...';

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 z-50 flex items-center justify-center">
      <Card 
        className="w-full max-w-md mx-4 shadow-lg"
        bodyStyle={{ padding: '24px' }}
      >
        <div className="text-center">
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 32, color: '#1890ff' }} spin />} 
            className="mb-4"
          />
          <h3 className="text-lg font-semibold mb-2 text-gray-800">
            {stageMessage}
          </h3>
          {showDetails && progress > 0 && (
            <div className="mt-4">
              <Progress 
                percent={Math.min(progress, 100)} 
                status={progress >= 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                showInfo={true}
                format={(percent) => `${Math.round(percent)}%`}
              />
              <p className="text-sm text-gray-500 mt-2">
                {progress < 30 && 'Preparando...'}
                {progress >= 30 && progress < 60 && 'Cargando imagen de fondo...'}
                {progress >= 60 && progress < 90 && 'Cargando asientos...'}
                {progress >= 90 && progress < 100 && 'Finalizando...'}
                {progress >= 100 && '¡Carga completada!'}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MapLoadingProgress;


