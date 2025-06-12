import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRefParam } from '../../contexts/RefContext';
import { FaHeart } from 'react-icons/fa';

const ThankYouPage = () => {
  const navigate = useNavigate();
  const { refParam } = useRefParam();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center bg-white rounded-lg shadow-lg p-8">
        <FaHeart className="mx-auto h-16 w-16 text-red-500 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">¡Gracias por tu Compra!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Esperamos que disfrutes del evento. No olvides llevar tus entradas contigo.
        </p>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Si necesitas ayuda o tienes alguna pregunta, no dudes en contactarnos.
          </p>
          <button
            onClick={() => {
              const path = refParam ? `/store?ref=${refParam}` : '/store';
              navigate(path);
            }}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Explorar más eventos
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;