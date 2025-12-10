/**
 * Servicio de encriptación para datos sensibles
 * Usa Web Crypto API para encriptación en el cliente
 * Compatible con encriptación de datos en tránsito y almacenamiento local
 */

// Cache de clave de encriptación para evitar regenerarla en cada llamada
let encryptionKeyCache = null;

// Obtener clave de encriptación desde variables de entorno o generar una derivada
const getEncryptionKey = async () => {
  // Si ya tenemos la clave en cache, retornarla
  if (encryptionKeyCache) {
    return encryptionKeyCache;
  }

  // En producción, esta clave DEBE venir de variables de entorno
  // Genera una clave segura usando: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  // Configúrala en el archivo .env como: REACT_APP_ENCRYPTION_KEY=tu-clave-aqui
  const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'ven-eventos-encryption-key-2024-default-change-in-production';

  // Advertencia en desarrollo si se usa la clave por defecto
  if (!process.env.REACT_APP_ENCRYPTION_KEY && process.env.NODE_ENV !== 'production') {
  }

  // Convertir la clave a formato que pueda usar Web Crypto API
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ENCRYPTION_KEY);

  try {
    // Crear un hash de la clave para asegurar 32 bytes (256 bits)
    // Usar SHA-256 para hash la clave y obtener exactamente 32 bytes
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    const hashArray = new Uint8Array(hashBuffer);

    // Importar la clave hasheada directamente como clave AES-GCM
    const encryptionKey = await crypto.subtle.importKey(
      'raw',
      hashArray,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );

    encryptionKeyCache = encryptionKey;
    return encryptionKey;
  } catch (error) {
    // Si falla, usar método simplificado expandiendo la clave
    // Expandir la clave a 32 bytes (256 bits) para AES-256-GCM
    const keyBytes = encoder.encode(ENCRYPTION_KEY);
    const keyArray = new Uint8Array(32);

    // Crear un hash simple expandiendo la clave
    for (let i = 0; i < 32; i++) {
      const byteIndex = i % keyBytes.length;
      keyArray[i] = keyBytes[byteIndex] ^ (i * 7) ^ (keyBytes.length * 13);
    }

    // Importar la clave expandida directamente
    const simpleKey = await crypto.subtle.importKey(
      'raw',
      keyArray,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );

    encryptionKeyCache = simpleKey;
    return simpleKey;
  }
};

// Generar un IV (Initialization Vector) aleatorio
const generateIV = () => {
  return crypto.getRandomValues(new Uint8Array(12)); // 12 bytes para AES-GCM
};

/**
 * Encriptar datos sensibles
 * @param {string|object} data - Datos a encriptar
 * @returns {Promise<string>} - Datos encriptados en formato base64
 */
export const encryptSensitiveData = async (data) => {
  try {
    if (!data) return null;

    // Convertir a string si es un objeto
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);

    // Obtener clave de encriptación
    const key = await getEncryptionKey();

    // Generar IV
    const iv = generateIV();

    // Convertir datos a ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);

    // Encriptar
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      dataBuffer
    );

    // Combinar IV y datos encriptados
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convertir a base64 para almacenamiento
    const base64 = btoa(String.fromCharCode(...combined));

    return base64;
  } catch (error) {
    console.error('[ENCRYPTION] Error encriptando datos:', error);
    throw new Error('Error al encriptar datos sensibles');
  }
};

/**
 * Desencriptar datos sensibles
 * @param {string} encryptedData - Datos encriptados en formato base64
 * @returns {Promise<string|object>} - Datos desencriptados
 */
export const decryptSensitiveData = async (encryptedData) => {
  try {
    if (!encryptedData) return null;

    // Convertir de base64 a ArrayBuffer
    const binaryString = atob(encryptedData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Extraer IV (primeros 12 bytes)
    const iv = bytes.slice(0, 12);
    const encrypted = bytes.slice(12);

    // Obtener clave de encriptación
    const key = await getEncryptionKey();

    // Desencriptar
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encrypted
    );

    // Convertir a string
    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decryptedBuffer);

    // Intentar parsear como JSON, si falla retornar string
    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  } catch (error) {
    console.error('[ENCRYPTION] Error desencriptando datos:', error);
    throw new Error('Error al desencriptar datos sensibles');
  }
};

/**
 * Encriptar datos para almacenamiento en localStorage
 * @param {string} key - Clave del localStorage
 * @param {any} data - Datos a almacenar
 */
export const setEncryptedItem = async (key, data) => {
  try {
    const encrypted = await encryptSensitiveData(data);
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error(`[ENCRYPTION] Error guardando ${key}:`, error);
    // Fallback: guardar sin encriptar si falla (con advertencia)
    localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
  }
};

/**
 * Desencriptar datos de localStorage
 * @param {string} key - Clave del localStorage
 * @returns {Promise<any>} - Datos desencriptados
 */
export const getEncryptedItem = async (key) => {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    // Intentar desencriptar
    try {
      return await decryptSensitiveData(encrypted);
    } catch (error) {
      // Si falla la desencriptación, puede ser que los datos no estén encriptados (compatibilidad)
      try {
        return JSON.parse(encrypted);
      } catch {
        return encrypted;
      }
    }
  } catch (error) {
    console.error(`[ENCRYPTION] Error leyendo ${key}:`, error);
    return null;
  }
};

/**
 * Encriptar datos de pago antes de enviarlos
 * @param {object} paymentData - Datos de pago
 * @returns {Promise<object>} - Datos de pago con campos sensibles encriptados
 */
export const encryptPaymentData = async (paymentData) => {
  try {
    const encrypted = { ...paymentData };

    // Campos sensibles a encriptar
    const sensitiveFields = [
      'cardNumber',
      'cvv',
      'expiryDate',
      'cardHolder',
      'accountNumber',
      'routingNumber',
      'pin',
      'password',
      'token',
      'secret',
      'apiKey',
      'privateKey'
    ];

    // Encriptar campos sensibles
    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        encrypted[field] = await encryptSensitiveData(encrypted[field]);
        encrypted[`${field}_encrypted`] = true;
      }
    }

    return encrypted;
  } catch (error) {
    console.error('[ENCRYPTION] Error encriptando datos de pago:', error);
    return paymentData; // Retornar sin encriptar si falla
  }
};

/**
 * Hash seguro de datos (una dirección, no reversible)
 * Útil para verificar integridad sin almacenar datos originales
 */
export const hashData = async (data) => {
  try {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);

    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  } catch (error) {
    console.error('[ENCRYPTION] Error hasheando datos:', error);
    return null;
  }
};

