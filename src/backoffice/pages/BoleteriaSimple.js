import React, { useState } from 'react';
import { message, Tabs } from 'antd';

const { TabPane } = Tabs;

const BoleteriaSimple = () => {
  const [activeTab, setActiveTab] = useState('compact');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold text-gray-800">🎫 Boletería</h1>
        <p className="text-sm text-gray-600">Sistema de venta de entradas</p>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Tabs para cambiar entre vistas */}
        <div className="bg-white border-b border-gray-200">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            className="px-4"
          >
            <TabPane tab="🎫 Vista Compacta" key="compact" />
            <TabPane tab="🗺️ Mapa Interactivo" key="map" />
          </Tabs>
        </div>

        {/* Área de trabajo principal */}
        <div className="flex-1 flex">
          {activeTab === 'compact' ? (
            // Vista compacta
            <div className="flex-1 overflow-auto p-4">
              <div className="text-center">
                <h2 className="text-lg font-medium text-gray-700 mb-4">Vista Compacta</h2>
                <p className="text-gray-500">Esta vista está temporalmente simplificada para resolver problemas de dependencias circulares.</p>
              </div>
            </div>
          ) : (
            // Vista con mapa interactivo
            <div className="flex-1 overflow-auto p-4">
              <div className="text-center">
                <h2 className="text-lg font-medium text-gray-700 mb-4">Mapa Interactivo</h2>
                <p className="text-gray-500">Esta vista está temporalmente simplificada para resolver problemas de dependencias circulares.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoleteriaSimple;
