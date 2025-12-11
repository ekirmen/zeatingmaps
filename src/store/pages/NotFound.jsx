import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = ({ title = '404', message = 'Página no encontrada', homePath = '/store' }) => {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-gray-900">{title}</h1>
        <p className="mt-4 text-lg text-gray-600">{message}</p>
        <div className="mt-8">
          <button
            onClick={() => navigate(homePath)}
            className="inline-flex items-center px-6 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;


