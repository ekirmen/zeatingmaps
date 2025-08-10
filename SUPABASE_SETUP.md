# Configuración de Supabase

## Variables de Entorno Requeridas

Para que la aplicación funcione correctamente, necesitas crear un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Development Environment
NODE_ENV=development
```

## Cómo Obtener las Claves

1. **URL del Proyecto**: Ve a tu dashboard de Supabase y copia la URL del proyecto
2. **Clave Anónima**: En Settings > API, copia la "anon public" key
3. **Clave de Servicio**: En Settings > API, copia la "service_role" key (mantén esta privada)

## Solución de Problemas

### Error: "Service role key no encontrada"
- Verifica que `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` esté definida en `.env.local`
- Reinicia el servidor de desarrollo después de agregar las variables

### Error: "Variables de entorno faltantes"
- Asegúrate de que tanto `REACT_APP_SUPABASE_URL` como `REACT_APP_SUPABASE_ANON_KEY` estén definidas
- El archivo debe llamarse exactamente `.env.local`

## Notas de Seguridad

- **NUNCA** subas el archivo `.env.local` al repositorio
- La clave de servicio tiene permisos administrativos, mantenla segura
- En producción, usa variables de entorno del servidor, no archivos `.env`
