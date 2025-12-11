/**
 * Utilidad para encriptar datos sensibles en tránsito (HTTPS ya lo hace, pero esto añade una capa extra)
 * Nota: En producción, HTTPS es suficiente, pero esta utilidad puede usarse para encriptar campos específicos
 */

import { encryptSensitiveData, decryptSensitiveData } from './encryption';

/**
 * Encriptar datos sensibles antes de enviarlos por HTTP
 * @param {object} data - Datos a enviar

 * @returns {Promise<object>} - Datos con campos sensibles encriptados
 */
export const encryptDataForTransit = async (data, sensitiveFields = []) => {
  try {
    const encrypted = { ...data };

    // Campos sensibles por defecto
    const defaultSensitiveFields = [
      'password',
      'cardNumber',
      'cvv',
      'expiryDate',
      'cardHolder',
      'accountNumber',
      'routingNumber',
      'pin',
      'token',
      'secret',
      'apiKey',
      'privateKey',
      'ssn',
      'creditCard',
      'bankAccount'
    ];

    const fieldsToEncrypt = sensitiveFields.length > 0
      ? sensitiveFields
      : defaultSensitiveFields;

    // Encriptar campos sensibles
    for (const field of fieldsToEncrypt) {
      if (encrypted[field] !== undefined && encrypted[field] !== null) {
        try {
          encrypted[field] = await encryptSensitiveData(encrypted[field]);
          encrypted[`${field}_encrypted`] = true;
        } catch (error) {
          // Continuar sin encriptar este campo
        }
      }
    }

    return encrypted;
  } catch (error) {
    console.error('[HTTP_ENCRYPTION] Error encriptando datos:', error);
    return data; // Retornar sin encriptar si falla
  }
};

/**
 * Desencriptar datos recibidos por HTTP
 * @param {object} data - Datos recibidos
 * @param {string[]} sensitiveFields - Campos sensibles a desencriptar
 * @returns {Promise<object>} - Datos con campos sensibles desencriptados
 */
export const decryptDataFromTransit = async (data, sensitiveFields = []) => {
  try {
    const decrypted = { ...data };

    // Campos sensibles por defecto
    const defaultSensitiveFields = [
      'password',
      'cardNumber',
      'cvv',
      'expiryDate',
      'cardHolder',
      'accountNumber',
      'routingNumber',
      'pin',
      'token',
      'secret',
      'apiKey',
      'privateKey',
      'ssn',
      'creditCard',
      'bankAccount'
    ];

    const fieldsToDecrypt = sensitiveFields.length > 0
      ? sensitiveFields
      : defaultSensitiveFields;

    // Desencriptar campos sensibles
    for (const field of fieldsToDecrypt) {
      if (decrypted[`${field}_encrypted`] && decrypted[field]) {
        try {
          decrypted[field] = await decryptSensitiveData(decrypted[field]);
          delete decrypted[`${field}_encrypted`];
        } catch (error) {
          // Continuar sin desencriptar este campo
        }
      }
    }

    return decrypted;
  } catch (error) {
    console.error('[HTTP_ENCRYPTION] Error desencriptando datos:', error);
    return data; // Retornar sin desencriptar si falla
  }
};

/**
 * Interceptor para fetch que encripta automáticamente datos sensibles
 */
export 

          // Encriptar datos sensibles
          const encryptedBody = await encryptDataForTransit(bodyData);

          // Actualizar opciones
          options.body = JSON.stringify(encryptedBody);
          options.headers = {
            ...options.headers,
            'Content-Type': 'application/json',
            'X-Encrypted': 'true'
          };
        } catch (error) {
        }
      }
    }

    // Hacer la petición
    const response = await originalFetch(url, options);

    // Desencriptar respuesta si está encriptada
    if (response.headers.get('X-Encrypted') === 'true') {
      try {
        const responseData = await response.json();
        const decryptedData = await decryptDataFromTransit(responseData);
        return new Response(JSON.stringify(decryptedData), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (error) {
      }
    }

    return response;
  };
};

