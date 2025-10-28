const DEFAULT_CASHEA_SDK_URL = 'https://cdn.cashea.app/webcheckout-sdk.min.js';

let loadingPromise = null;

const loadScript = (url) => new Promise((resolve, reject) => {
  const existingScript = document.querySelector(`script[data-cashea-sdk="${url}"]`);
  if (existingScript) {
    if (existingScript.getAttribute('data-loaded') === 'true') {
      resolve();
      return;
    }
    existingScript.addEventListener('load', resolve);
    existingScript.addEventListener('error', () => reject(new Error('No se pudo cargar el SDK de Cashea')));
    return;
  }

  const script = document.createElement('script');
  script.src = url;
  script.async = true;
  script.defer = true;
  script.setAttribute('data-cashea-sdk', url);
  script.addEventListener('load', () => {
    script.setAttribute('data-loaded', 'true');
    resolve();
  });
  script.addEventListener('error', () => {
    script.remove();
    reject(new Error('No se pudo cargar el SDK de Cashea'));
  });
  document.head.appendChild(script);
});

export const loadCasheaSdk = async (customUrl) => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (window.WebCheckoutSDK) {
    return window.WebCheckoutSDK;
  }

  const sdkUrl = customUrl || DEFAULT_CASHEA_SDK_URL;

  if (!loadingPromise) {
    loadingPromise = loadScript(sdkUrl)
      .then(() => window.WebCheckoutSDK || null)
      .finally(() => {
        loadingPromise = null;
      });
  }

  return loadingPromise;
};

export const resetCasheaSdkLoader = () => {
  loadingPromise = null;
};

export { DEFAULT_CASHEA_SDK_URL };
