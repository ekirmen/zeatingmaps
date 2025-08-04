import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <Link to="/store" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
              ← Volver al inicio
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Política de Privacidad</h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              Hc Bussines Corp. titular de los derechos de, Kreatickets, con domicilio en 800W Landstreet suite 3. 
              Ciudad: Orlando Estado: Florida Código Postal: 32824 País: USA, en cumplimiento a lo señalado por la 
              Ley Federal de Datos Personales en Posesión de los Particulares, tiene como objetivo la protección 
              de la información personal proporcionada por cada persona, para lo cual, establece el siguiente:
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Aviso de Privacidad</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Información Personal Solicitada:</h3>
            <p className="text-gray-700 mb-4">
              Kreatickets garantiza la confidencialidad de la información personal de los usuarios que ingresan a este sitio, 
              con la finalidad de proporcionar un excelente servicio Kreatickets podrá hacerle llegar mensajes que puedan 
              ser de su interés ya sean propios o bien de nuestros anunciantes y/o publicidad de terceros con quién 
              Kreatickets tenga celebrados algunos convenios. Los datos personales que se solicitan a los usuarios al 
              momento de registrarse son: nombre, Email (dirección de correo electrónico), dirección, código postal, 
              teléfonos fijo o celular, lugar de residencia, e información de tarjetas de crédito con el objeto de 
              que pueda realizar su compra.
            </p>

            <p className="text-gray-700 mb-4">
              La información que obtiene Kreatickets es necesaria para realizar la venta de boletos al usuario que 
              desee adquirirlos, así como para realizar encuestas, estudios de mercado, para evaluación de los 
              servicios que presta, promocionar eventos, y publicidad de terceros con quién Kreatickets tenga 
              celebrados convenios.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Utilizamos los datos personales para:</h3>
            <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2">
              <li>Proporcionar nuestros servicios</li>
              <li>Detectar y prevenir fraudes</li>
              <li>Mitigar pérdidas financieras u otros daños a los Usuarios</li>
              <li>Promover, analizar y mejorar nuestros productos, sistemas y herramientas</li>
            </ol>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Privacidad y Protección de Datos Personales:</h3>
            <p className="text-gray-700 mb-4">
              Kreatickets utiliza tecnología de punta con procesos para la protección de la información proporcionada 
              por los titulares de los datos personales, que permite cifrar, codificar y prevenir la intrusión a la 
              información suministrada por Internet, incluyendo la información relativa a tarjetas de crédito y 
              direcciones de correo electrónico.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Derechos:</h3>
            <p className="text-gray-700 mb-4">
              Conforme a la Ley Federal de Datos Personales en Posesión de los Particulares en cualquier momento 
              puede ejercer sus siguientes derechos:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Acceso:</strong> El Titular a través de correo electrónico o vía telefónica, podrá aclarar o conocer cualquier uso de sus datos personales por parte de Kreatickets.</li>
              <li><strong>Rectificación:</strong> El Titular podrá solicitar a Kreatickets en cualquier momento que sus datos sean corregidos o modificados en caso de que sea incorrecta o inexacta.</li>
              <li><strong>Cancelación:</strong> El titular de la información podrá solicitar a Kreatickets cancelar o eliminar sus datos personales, cuando considere que no están siendo utilizados o tratados conforme a las obligaciones y deberes que tiene Kreatickets.</li>
              <li><strong>Oposición:</strong> Si el titular no tiene relación u obligación legal con Kreatickets o no desea contratar servicio alguno, puede no compartir sus datos personales.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Solicitud de eliminación o modificación de datos personales:</h3>
            <p className="text-gray-700 mb-4">
              El titular de la información personal podrá en cualquier momento solicitar a Kreatickets la cancelación 
              o modificación de sus datos personales, para lo cual el usuario y/o titular canalizará su solicitud 
              a través de correo electrónico a la siguiente dirección{' '}
              <a href="mailto:info@kreatickets.com" className="text-blue-600 hover:text-blue-800">
                info@kreatickets.com
              </a>{' '}
              quien en un término de 72 horas le notificará por la misma vía el cumplimiento de su petición.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Uso de Cookies:</h3>
            <p className="text-gray-700 mb-4">
              Nuestro sitio utiliza cookies para personalizar y para mejorar su experiencia de compras. Estas cookies 
              no contienen ninguna información confidencial o personal. Permiten que realcemos su experiencia de 
              compra en www.kreatickets.com
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Seguridad:</h3>
            <p className="text-gray-700 mb-4">
              Utilizamos métodos standard para proteger su información contra el acceso desautorizado. Entre otras 
              técnicas, almacenamos la información en clúster de servidores detrás de nuestro "firewall" en una 
              localización segura, y restringimos el número de empleados que pueden tener acceso a tales datos.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Cambie su Información Personal:</h3>
            <p className="text-gray-700 mb-4">
              Usted puede modificar o cambiar en cualquier momento cualquier información que usted nos haya proporcionado 
              previamente, haciendo clic en "Tú Cuenta" en nuestro Home Page.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8. Modificaciones al Aviso de Privacidad:</h3>
            <p className="text-gray-700 mb-4">
              Kreatickets se reserva el derecho de modificar y/o actualizar en cualquier momento el presente aviso 
              de privacidad. Si usted tiene algunas preguntas o preocupaciones con respecto a nuestro Aviso de 
              Privacidad, por favor siéntase libre de contactarnos en{' '}
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

export default PrivacyPolicy; 