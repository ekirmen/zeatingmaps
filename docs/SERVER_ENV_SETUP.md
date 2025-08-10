# Configuración de Variables de Entorno del Servidor

## Variables Requeridas

Para que el servidor funcione correctamente con la base de datos Supabase, necesitas configurar las siguientes variables de entorno:

### Archivo `.env` (en la raíz del proyecto)

```bash
# Supabase Configuration
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Puerto del servidor (opcional, por defecto 3001)
PORT=3001
```

## Cómo Obtener las Credenciales

### 1. SUPABASE_URL
- Ve a tu [Dashboard de Supabase](https://app.supabase.com)
- Selecciona tu proyecto
- Ve a **Settings** > **API**
- Copia la **Project URL**

### 2. SUPABASE_SERVICE_ROLE_KEY
- En la misma página de **Settings** > **API**
- Copia la **service_role** key (¡NO la anon key!)
- ⚠️ **IMPORTANTE**: Esta key tiene permisos de administrador, manténla segura

## Configuración del Servidor

### Opción 1: Archivo .env (Recomendado)
1. Crea un archivo `.env` en la raíz del proyecto
2. Agrega las variables de entorno
3. Reinicia el servidor

### Opción 2: Variables de Entorno del Sistema
```bash
# Windows (PowerShell)
$env:SUPABASE_URL="tu_url"
$env:SUPABASE_SERVICE_ROLE_KEY="tu_key"

# Windows (CMD)
set SUPABASE_URL=tu_url
set SUPABASE_SERVICE_ROLE_KEY=tu_key

# Linux/Mac
export SUPABASE_URL="tu_url"
export SUPABASE_SERVICE_ROLE_KEY="tu_key"
```

## Verificación

Para verificar que la configuración funciona:

1. Inicia el servidor: `npm run server`
2. Deberías ver en los logs:
   ```
   🚀 Servidor de desarrollo ejecutándose en puerto 3001
   📡 API disponible en http://localhost:3001/api
   🔍 Health check en http://localhost:3001/health
   ```

3. Si no hay credenciales, verás warnings:
   ```
   [API] Credenciales de Supabase no encontradas, usando datos mock
   ```

## Fallback a Datos Mock

Si no configuras las credenciales de Supabase, el servidor funcionará con datos simulados. Esto es útil para desarrollo, pero los cambios no persistirán en la base de datos.

## Seguridad

- **NUNCA** commits el archivo `.env` al repositorio
- Agrega `.env` a tu `.gitignore`
- La `service_role` key tiene permisos completos, úsala solo en el servidor
- En producción, usa variables de entorno del sistema o un gestor de secretos

## Solución de Problemas

### Error: "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
- Verifica que el archivo `.env` existe y tiene las variables correctas
- Reinicia el servidor después de cambiar las variables
- Verifica que no hay espacios extra en las variables

### Error de Conexión a Supabase
- Verifica que la URL y la key son correctas
- Asegúrate de que tu proyecto de Supabase esté activo
- Verifica que la `service_role` key no haya expirado

### Datos No Persisten
- Verifica que las credenciales están configuradas correctamente
- Revisa los logs del servidor para errores de base de datos
- Verifica que las tablas `mapas` y `zonas` existen en Supabase
