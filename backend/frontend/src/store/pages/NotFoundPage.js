import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { FaExclamationTriangle } from 'react-icons/fa';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { refParam } = useRefParam();

  const handleHome = () => {
    const path = refParam ? `/store?ref=${refParam}` : '/store';
    navigate(path);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow bg-gray-100 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center bg-white rounded-lg shadow-lg p-8">
          <FaExclamationTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Página no encontrada</h1>
          <p className="text-lg text-gray-600 mb-8">
            La página que buscas no existe o fue movida.
          </p>
          <button
            onClick={handleHome}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
