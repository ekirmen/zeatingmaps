import React from 'react';
import { Link } from 'react-router-dom';


const LegalTerms = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <Link to="/store" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
              ← Volver al inicio
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Condiciones Legales</h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Bienvenidos a los Términos de Uso de Kreatickets
            </h2>

            <p className="text-gray-700 mb-6">
              Si estás buscando una forma fácil y segura de comprar tus tickets para eventos, estás en el lugar correcto.
              En Kreatickets te ofrecemos una plataforma confiable donde podrás adquirir tus entradas de forma rápida y sin complicaciones.
            </p>

            <p className="text-gray-700 mb-6">
              Antes de realizar tu compra, te invitamos a leer detenidamente nuestros Términos de Uso para que estés
              completamente informado y puedas disfrutar de tu experiencia con nosotros sin contratiempos.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Ventas definitivas</h3>
            <p className="text-gray-700 mb-4">
              Todas las ventas realizadas a través de nuestra plataforma son definitivas. No se aceptan devoluciones,
              cambios o reembolsos. Los reembolsos solo se realizaran para los eventos suspendidos o reprogramados.
            </p>
            <p className="text-gray-700 mb-4">
              Solo se reembolsa el costo del ticket. Kreatickets.com no envía boletos a domicilio.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Atención telefónica</h3>
            <p className="text-gray-700 mb-4">
              Nuestro equipo de atención al cliente está disponible para ayudarte de lunes a sábado, de 9am a 6 pm.
              Si necesitas asistencia, no dudes en contactarnos durante esos horarios y estaremos encantados de resolver tus dudas.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Retiro de tickets en taquilla</h3>
            <p className="text-gray-700 mb-4">
              En caso de que tu compra requiera que retires tus tickets en la taquilla "will call", podrás hacerlo
              el día del evento en la taquilla del recinto. Es importante que llegues temprano para evitar contratiempos
              y asegurarte de tener tiempo suficiente para estacionarte y acceder al lugar antes de que empiece el espectáculo.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Identificación requerida</h3>
            <p className="text-gray-700 mb-4">
              Recuerda llevar contigo la tarjeta de crédito que utilizaste para realizar la compra, ya que te será
              solicitada en el momento de retirar tus tickets. Si otra persona va a recoger los tickets en tu nombre,
              deberá presentar una autorización junto con una copia de tu confirmación de orden y el número de confirmación.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Cancelaciones y cambios de evento</h3>
            <p className="text-gray-700 mb-4">
              En caso de que por decisión de los productores el evento no se realice en la fecha y horario previamente
              anunciado al público, los usuarios podrán solicitar el reembolso del precio final del ticket, esto no
              incluye los Cargos por Servicio y Costo de Despacho. Nos pondremos en contacto contigo vía email dentro
              del plazo permitido para comunicarte la situación.
            </p>

            <p className="text-gray-700 mb-4">
              Tratándose de la postergación del evento para una nueva fecha y hora, el adquirente podrá optar por
              devolver el ticket y solicitar el reembolso del precio final que hubiere pagado por ella, ajustándose
              a los plazos informados y publicados en KREATICKETS.com, o canjear su ticket en cualquier Punto de
              Venta Autorizado por una nueva entrada de igual valor, o de mayor valor cancelando la diferencia,
              para ingresar al mismo evento en la nueva fecha.
            </p>

            <p className="text-gray-700 mb-4">
              KREATICKETS.COM queda expresamente liberada de responsabilidad en caso de que no esté disponible para
              la nueva fecha la misma localidad o asiento elegido por el usuario para la primera fecha, siendo a cargo
              de los productores el pago de cualquier indemnización que pudiere corresponder al respecto.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Limitaciones y responsabilidades</h3>
            <p className="text-gray-700 mb-4">
              Al realizar una compra a través de Kreatickets, aceptas y reconoces todas las limitaciones y
              responsabilidades expuestas en estos Términos de Uso.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Derechos de privacidad</h3>
            <p className="text-gray-700 mb-4">
              Queremos que tengas pleno control sobre tus datos personales. Por ello, de acuerdo con la Ley Federal
              de Datos Personales en Posesión de los Particulares, te otorgamos los siguientes derechos:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>Acceso:</strong> Puedes contactarnos por correo electrónico o vía telefónica para aclarar o conocer cualquier uso de tus datos personales por parte de Kreatickets.</li>
              <li><strong>Rectificación:</strong> Si tus datos son incorrectos o inexactos, puedes solicitar su corrección o modificación en cualquier momento.</li>
              <li><strong>Cancelación:</strong> Si consideras que tus datos no están siendo utilizados adecuadamente o no existen obligaciones legales o contractuales con Kreatickets, puedes solicitar la cancelación o eliminación de tus datos personales.</li>
              <li><strong>Oposición:</strong> Si no deseas compartir tus datos personales o no quieres que sean utilizados para ciertos fines, puedes oponerte a ello.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8. Contacto</h3>
            <p className="text-gray-700 mb-4">
              En Kreatickets nos preocupamos por brindarte la mejor experiencia posible al comprar tus tickets para eventos.
              Si tienes alguna duda o necesitas asistencia, no dudes en contactarnos. ¡Estamos aquí para ayudarte!
            </p>

            <p className="text-gray-700 mb-4">
              Para reportar uso fraudulento de datos, contacta a{' '}
              <a href="mailto:kreatickets@gmail.com" className="text-blue-600 hover:text-blue-800">
                kreatickets@gmail.com
              </a>{' '}
              hasta 48 horas antes del evento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalTerms; 
