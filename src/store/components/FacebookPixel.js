import React, { useEffect, useRef } from 'react';

// Defer loading of Facebook Pixel until idle time or first user interaction.
const FacebookPixel = ({ pixelId, pixelScript, eventName, eventData = {} }) => {
  const scriptRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!pixelId && !pixelScript) return;

    const doLoad = () => {
      if (loadedRef.current) return;
      loadedRef.current = true;

      // Add inline initializer that sets up fbq queue and then loads the remote script.
      try {
        if (!window.fbq) {
          const init = document.createElement('script');
          init.type = 'text/javascript';
          init.async = true;
          init.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod? n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');`;
          document.head.appendChild(init);
          scriptRef.current = init;
        }

        // initialize pixel after script is available (fbq will queue calls if not yet ready)
        try { window.fbq && window.fbq('init', pixelId); } catch (e) { /* ignore */ }
        try { window.fbq && window.fbq('track', 'PageView'); } catch (e) { /* ignore */ }
      } catch (err) {
        // swallow
      }
    };

    // Fallback: load during idle time, or after a short timeout
    let idleId = null;
    let timerId = null;

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(doLoad, { timeout: 2000 });
    } else {
      timerId = setTimeout(doLoad, 2000);
    }

    // Also load immediately on first user interaction
    const onFirstInteraction = () => {
      doLoad();
      removeListeners();
    };

    const removeListeners = () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      if (idleId && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
      if (timerId) clearTimeout(timerId);
    };

    window.addEventListener('pointerdown', onFirstInteraction, { passive: true });
    window.addEventListener('keydown', onFirstInteraction, { passive: true });

    // Track event after a small delay if provided
    if (eventName) {
      const t = setTimeout(() => {
        try { window.fbq && window.fbq('track', eventName, eventData); } catch (e) { }
      }, 1000);
      // ensure cleanup
      return () => {
        removeListeners();
        clearTimeout(t);
        if (scriptRef.current) {
          try { document.head.removeChild(scriptRef.current); } catch (e) { }
        }
      };
    }

    return () => {
      try { window.removeEventListener('pointerdown', onFirstInteraction); } catch (e) { }
      try { window.removeEventListener('keydown', onFirstInteraction); } catch (e) { }
      if (idleId && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
      if (timerId) clearTimeout(timerId);
      if (scriptRef.current) {
        try { document.head.removeChild(scriptRef.current); } catch (e) { }
      }
    };
  }, [pixelId, pixelScript, eventName, eventData]);

  if (!pixelId && !pixelScript) return null;

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