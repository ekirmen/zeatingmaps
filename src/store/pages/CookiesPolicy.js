import React from 'react';
import { Link } from 'react-router-dom';

const CookiesPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <Link to="/store" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
              ← Volver al inicio
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Política de Cookies</h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">USO DE COOKIES</h2>
            
            <p className="text-gray-700 mb-6">
              Nuestro sitio utiliza cookies para personalizar y para mejorar su experiencia de compras. 
              Estas cookies no contienen ninguna información confidencial o personal. Permiten que realcemos 
              su experiencia de compra en <strong>Kreatickets</strong>. Por ejemplo, si usted ha agregado 
              productos a su carro de compras y repentinamente tiene que cerrar el sitio, usted puede volver 
              más tarde ese mismo día y todavía tener esos artículos en su carro de compras.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">¿Qué son las cookies?</h3>
            <p className="text-gray-700 mb-4">
              Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (computadora, 
              tablet o teléfono móvil) cuando visita nuestro sitio web. Estas cookies nos ayudan a 
              recordar sus preferencias y a mejorar su experiencia de navegación.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Tipos de cookies que utilizamos:</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Cookies esenciales:</strong> Son necesarias para el funcionamiento básico del sitio web y no se pueden desactivar.</li>
              <li><strong>Cookies de rendimiento:</strong> Nos ayudan a entender cómo interactúan los visitantes con nuestro sitio web.</li>
              <li><strong>Cookies de funcionalidad:</strong> Permiten que el sitio web recuerde las elecciones que usted hace.</li>
              <li><strong>Cookies de marketing:</strong> Se utilizan para rastrear visitantes en sitios web con el fin de mostrar anuncios relevantes.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">¿Cómo gestionar las cookies?</h3>
            <p className="text-gray-700 mb-4">
              Puede configurar su navegador para rechazar todas las cookies o para que le avise cuando 
              se envía una cookie. Sin embargo, si rechaza las cookies, es posible que algunas partes 
              de nuestro sitio web no funcionen correctamente.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Cookies de terceros:</h3>
            <p className="text-gray-700 mb-4">
              También utilizamos servicios de terceros que pueden establecer cookies en su dispositivo. 
              Estos servicios incluyen:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Google Analytics para análisis de tráfico web</li>
              <li>Facebook Pixel para publicidad dirigida</li>
              <li>Proveedores de procesamiento de pagos</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Actualizaciones de esta política:</h3>
            <p className="text-gray-700 mb-4">
              Nos reservamos el derecho de actualizar esta política de cookies en cualquier momento. 
              Le recomendamos revisar esta página periódicamente para estar al tanto de cualquier cambio.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Contacto:</h3>
            <p className="text-gray-700 mb-4">
              Si tiene alguna pregunta sobre nuestra política de cookies, puede contactarnos en{' '}
              <a href="mailto:info@kreatickets.com" className="text-blue-600 hover:text-blue-800">
                info@kreatickets.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiesPolicy; 
