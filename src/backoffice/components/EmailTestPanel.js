import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { AiOutlineMail, AiOutlineDatabase, AiOutlineCheckCircle, AiOutlineCloseCircle } from 'react-icons/ai';
import emailService from '../services/emailService';
import { emailCampaignService } from '../services/emailCampaignService';

const EmailTestPanel = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [showPanel, setShowPanel] = useState(false);

  const runEmailTest = async () => {
    setLoading(true);
    try {
      const result = await emailService.testConnection();
      setTestResults(prev => ({
        ...prev,
        email: result ? 'success' : 'error'
      }));
      
      if (result) {
        toast.success('✅ Conexión de email exitosa');
      } else {
        toast.error('❌ Error en conexión de email');
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        email: 'error'
      }));
      toast.error(`❌ Error de email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runDatabaseTest = async () => {
    setLoading(true);
    try {
      const campaigns = await emailCampaignService.getCampaigns();
      setTestResults(prev => ({
        ...prev,
        database: campaigns.length >= 0 ? 'success' : 'error'
      }));
      
      toast.success(`✅ Base de datos conectada (${campaigns.length} campañas)`);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        database: 'error'
      }));
      toast.error(`❌ Error de base de datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runFullTest = async () => {
    setLoading(true);
    await Promise.all([
      runEmailTest(),
      runDatabaseTest()
    ]);
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <AiOutlineCheckCircle className="text-green-500" />;
      case 'error':
        return <AiOutlineCloseCircle className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return 'Conectado';
      case 'error':
        return 'Error';
      default:
        return 'No probado';
    }
  };

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 z-50"
        title="Panel de Pruebas"
      >
        <AiOutlineMail className="text-xl" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Panel de Pruebas
        </h3>
        <button
          onClick={() => setShowPanel(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <AiOutlineCloseCircle />
        </button>
      </div>

      <div className="space-y-4">
        {/* Estado de Conexiones */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Estado de Conexiones</h4>
          
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <AiOutlineMail />
              <span className="text-sm">Email Service</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.email)}
              <span className={`text-sm ${testResults.email === 'success' ? 'text-green-600' : testResults.email === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
                {getStatusText(testResults.email)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <AiOutlineDatabase />
              <span className="text-sm">Base de Datos</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.database)}
              <span className={`text-sm ${testResults.database === 'success' ? 'text-green-600' : testResults.database === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
                {getStatusText(testResults.database)}
              </span>
            </div>
          </div>
        </div>

        {/* Botones de Prueba */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Pruebas</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={runEmailTest}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Probar Email
            </button>
            
            <button
              onClick={runDatabaseTest}
              disabled={loading}
              className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
            >
              Probar DB
            </button>
          </div>

          <button
            onClick={runFullTest}
            disabled={loading}
            className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Probando...' : 'Prueba Completa'}
          </button>
        </div>

        {/* Configuración */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Configuración</h4>
          
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Email Provider:</span>
              <span className="font-mono">{process.env.REACT_APP_EMAIL_PROVIDER || 'No configurado'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">From Email:</span>
              <span className="font-mono">{process.env.REACT_APP_FROM_EMAIL || 'No configurado'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Base URL:</span>
              <span className="font-mono">{process.env.REACT_APP_BASE_URL || 'No configurado'}</span>
            </div>
          </div>
        </div>

        {/* Información de Debug */}
        {process.env.NODE_ENV === 'development' && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Debug Info</h4>
            
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Environment:</span>
                <span className="font-mono">{process.env.NODE_ENV}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Debug Mode:</span>
                <span className="font-mono">{process.env.REACT_APP_DEBUG ? 'ON' : 'OFF'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailTestPanel; 