import React, { useEffect, useRef } from 'react';

const FacebookPixel = ({ pixelId, pixelScript, eventName, eventData = {} }) => {
  const scriptRef = useRef(null);

  useEffect(() => {
    if (!pixelId && !pixelScript) return;

    // Función para cargar el píxel de Facebook
    const loadFacebookPixel = () => {
      // Si ya existe el script, no lo cargamos de nuevo
      if (window.fbq) {
        return;
      }

      // Crear el script del píxel de Facebook
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `;
      
      document.head.appendChild(script);
      scriptRef.current = script;
    };

    // Función para trackear eventos personalizados
    const trackEvent = () => {
      if (window.fbq && eventName) {
        window.fbq('track', eventName, eventData);
      }
    };

    // Cargar el píxel
    loadFacebookPixel();

    // Trackear el evento después de un pequeño delay para asegurar que fbq esté disponible
    if (eventName) {
      setTimeout(trackEvent, 1000);
    }

    // Cleanup
    return () => {
      if (scriptRef.current) {
        document.head.removeChild(scriptRef.current);
      }
    };
  }, [pixelId, pixelScript, eventName, eventData]);

  // Si no hay píxel configurado, no renderizar nada
  if (!pixelId && !pixelScript) {
    return null;
  }

  // Renderizar el noscript tag para casos donde JavaScript está deshabilitado
  return (
    <>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
};

export default FacebookPixel; 