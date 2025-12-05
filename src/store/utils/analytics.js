const _defer = (fn) => {
  let called = false;
  const run = () => {
    if (called) return;
    called = true;
    try {
      fn();
    } catch (e) {
      console.warn('[Analytics] deferred load failed', e);
    }
    removeListeners();
  };

  const removeListeners = () => {
    window.removeEventListener('mousemove', run);
    window.removeEventListener('touchstart', run);
    window.removeEventListener('scroll', run);
    window.removeEventListener('keydown', run);
    window.removeEventListener('click', run);
  };

  // Try to run during idle period
  if ('requestIdleCallback' in window) {
    try {
      window.requestIdleCallback(run, { timeout: 2000 });
    } catch (e) {
      setTimeout(run, 2000);
    }
  } else {
    setTimeout(run, 2000);
  }

  // Also trigger on first user interaction to speed up on interaction-heavy pages
  window.addEventListener('mousemove', run, { once: true });
  window.addEventListener('touchstart', run, { once: true });
  window.addEventListener('scroll', run, { once: true });
  window.addEventListener('keydown', run, { once: true });
  window.addEventListener('click', run, { once: true });
};

export const loadGtm = (gtmId) => {
  if (!gtmId) return;
  _defer(() => {
    if (!window.dataLayer) {
      window.dataLayer = [];
      window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
      document.head.appendChild(script);
      const noscript = document.createElement('noscript');
      noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      document.body.appendChild(noscript);
    }
  });
};

export const loadMetaPixel = (pixelId) => {
  if (!pixelId) return;
  _defer(() => {
    if (!window.fbq) {
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    }
    try {
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    } catch (e) {
      // ignore until script loads
    }
  });
};

export const trackEvent = (name, payload = {}) => {
  try {
    if (window.dataLayer) {
      window.dataLayer.push({
        event: name,
        ...payload,
      });
    }

    if (window.fbq) {
      window.fbq('trackCustom', name, payload);
    }
  } catch (err) {
    console.warn('[Analytics] Error al trackear evento', name, err);
  }
};
