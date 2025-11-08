# Configuración de Clave de Encriptación

## ¿Qué es REACT_APP_ENCRYPTION_KEY?

Es la clave secreta utilizada para encriptar datos sensibles en el cliente, como:
- Tokens de autenticación en localStorage
- Datos de pago antes de enviarlos al servidor
- Información sensible del usuario

## ⚠️ IMPORTANTE: Seguridad

1. **NUNCA** compartas esta clave públicamente
2. **NUNCA** la subas a Git (ya está en .gitignore)
3. **Genera una clave diferente** para cada entorno (desarrollo, staging, producción)
4. **Mantén la clave segura** y solo accesible para el equipo autorizado

## 🔑 Generar una Clave Segura

### Opción 1: Usando Node.js (Recomendado)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Opción 2: Usando OpenSSL

```bash
openssl rand -base64 32
```

### Opción 3: Online (solo si confías en el sitio)

Usa un generador de claves seguro como:
- https://www.random.org/strings/
- Genera una cadena de al menos 32 caracteres aleatorios

## 📝 Configuración

### 1. Crear archivo `.env` en la raíz del proyecto

Crea un archivo `.env` (no `.env.example`) con:

```env
REACT_APP_ENCRYPTION_KEY=tu-clave-generada-aqui
```

### 2. Ejemplo de clave generada

```
REACT_APP_ENCRYPTION_KEY=vL/7jJExho2un1Loqfurcbq+2CVaE+AdDnxW3a6A8is=
```

### 3. Para Producción (Vercel/Netlify)

Configura la variable de entorno en el panel de tu hosting:

**Vercel:**
1. Ve a Settings → Environment Variables
2. Agrega `REACT_APP_ENCRYPTION_KEY` con tu clave
3. Selecciona los entornos apropiados (Production, Preview, Development)

**Netlify:**
1. Ve a Site settings → Environment variables
2. Agrega `REACT_APP_ENCRYPTION_KEY` con tu clave
3. Selecciona los scopes apropiados

## 🔄 Rotación de Claves

Si necesitas cambiar la clave:

1. **Genera una nueva clave** usando uno de los métodos arriba
2. **Actualiza** la variable de entorno
3. **Nota**: Los datos encriptados con la clave anterior NO podrán ser desencriptados
4. **Recomendación**: Si rotas la clave, los usuarios necesitarán volver a iniciar sesión

## 🔍 Verificar que Funciona

1. Inicia sesión en la aplicación
2. Abre las DevTools (F12)
3. Ve a Application → Local Storage
4. El token debería estar encriptado (no deberías ver el token JWT en texto plano)
5. Revisa la consola: no deberías ver errores de encriptación

## ❓ Troubleshooting

### Error: "Error al encriptar datos sensibles"

- Verifica que `REACT_APP_ENCRYPTION_KEY` esté configurada
- Verifica que la clave tenga al menos 16 caracteres
- Revisa la consola del navegador para más detalles

### Los datos no se encriptan

- El sistema tiene un fallback que almacena sin encriptar si falla
- Revisa la consola para ver advertencias
- Verifica que Web Crypto API esté disponible en el navegador

### No puedo iniciar sesión después de cambiar la clave

- Los tokens encriptados con la clave anterior no pueden ser desencriptados
- Solución: Limpia localStorage y vuelve a iniciar sesión
- O: Usa la clave anterior temporalmente para migrar los datos

## 📚 Referencias

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [AES-GCM Encryption](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt)
- [Best Practices for Key Management](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

