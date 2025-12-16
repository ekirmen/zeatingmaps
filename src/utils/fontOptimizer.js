/**
 * Utilidades para optimizar carga de fuentes
 * - font-display: swap para evitar FOIT (Flash of Invisible Text)
 * - Preload de fuentes críticas
 * - Subset fonts
 */

/**
 * Crea un link de preload para una fuente
 */
export const preloadFont = (fontUrl, fontFormat = 'woff2', crossorigin = 'anonymous') => {
  if (typeof document === 'undefined') return;

  // Verificar si ya existe el preload
  const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
  if (existingLink) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = `font/${fontFormat}`;
  link.href = fontUrl;
  link.crossOrigin = crossorigin;
  document.head.appendChild(link);
};

/**
 * Carga una fuente de forma asíncrona
 */
export const loadFont = (fontFamily, fontUrl, options = {}) => {
  if (typeof document === 'undefined') return;
  
  const {
    fontFormat = 'woff2',
    fontStyle = 'normal',
    fontWeight = 'normal',
    fontDisplay = 'swap', // swap, optional, fallback, block
    preload = false,
  } = options;
  
  // Preload si es necesario
  if (preload) {
    preloadFont(fontUrl, fontFormat);
  }
  
  // Crear @font-face dinámicamente
  const fontFace = new FontFace(
    fontFamily,
    `url(${fontUrl}) format('${fontFormat}')`,
    {
      style: fontStyle,
      weight: fontWeight,
      display: fontDisplay,
    }
  );
  
  fontFace.load().then((loadedFont) => {
    document.fonts.add(loadedFont);
  }).catch((error) => {
    console.error(`Error loading font ${fontFamily}:`, error);
  });
};

/**
 * Verifica si una fuente está cargada
 */
export const isFontLoaded = (fontFamily) => {
  if (typeof document === 'undefined' || !document.fonts) return false;
  
  return document.fonts.check(`12px "${fontFamily}"`);
};

/**
 * Espera a que una fuente se cargue
 */
export const waitForFont = async (fontFamily, timeout = 3000) => {
  if (typeof document === 'undefined' || !document.fonts) return false;
  
  try {
    await document.fonts.ready;
    if (isFontLoaded(fontFamily)) return true;
    
    // Esperar con timeout
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkFont = () => {
        if (isFontLoaded(fontFamily)) {
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          resolve(false);
          return;
        }
        
        setTimeout(checkFont, 100);
      };
      
      checkFont();
    });
  } catch (error) {
    console.error(`Error waiting for font ${fontFamily}:`, error);
    return false;
  }
};

/**
 * CSS para font-display: swap
 * Úsalo en tu CSS global o en componentes críticos
 */
// Nota: Si quieres inyectar CSS dinámico para font-display usa otra util o incluye en tu CSS global.
export default {
  preloadFont,
  loadFont,
  isFontLoaded,
  waitForFont,
};

