# 🔧 Instrucciones para Solucionar el Error 401

## 🔍 Diagnóstico del Problema

El error 401 Unauthorized indica que hay un problema de autenticación. Basándome en los logs, parece que el usuario no está correctamente autenticado en el backoffice.

## 🛠️ Pasos para Solucionar

### 1. Verificar Estado de Autenticación

Ejecuta este script en la consola del navegador para verificar el estado:

```javascript
// Copia y pega este código en la consola del navegador
console.log('🔍 Verificando estado de autenticación...');

// Verificar token
const token = localStorage.getItem('token');
console.log('Token:', token ? '✅ Presente' : '❌ Ausente');

// Verificar sesión de Supabase
if (window.supabase) {
  window.supabase.auth.getSession().then(({ data: { session }, error }) => {
    console.log('Sesión:', session ? '✅ Activa' : '❌ Inactiva');
    if (session) {
      console.log('Usuario:', session.user.email);
      console.log('Expira:', new Date(session.expires_at * 1000));
    }
  });
}
```

### 2. Soluciones Posibles

#### Opción A: Iniciar Sesión
Si no hay sesión activa:
1. Ve a la página de login del backoffice
2. Inicia sesión con tus credenciales
3. Verifica que aparezca el mensaje de éxito

#### Opción B: Limpiar y Reiniciar
Si hay problemas con la sesión:
1. Abre la consola del navegador (F12)
2. Ejecuta: `localStorage.clear()`
3. Recarga la página
4. Inicia sesión nuevamente

#### Opción C: Verificar Permisos
Si estás autenticado pero sigue el error:
1. Verifica que tu usuario tenga permisos para acceder a la tabla `funciones`
2. Contacta al administrador para verificar los permisos de RLS

### 3. Verificar en la Interfaz

He agregado un componente de debug que muestra el estado de autenticación en la página de Funciones. Deberías ver:

- ✅ **Verde**: Usuario autenticado correctamente
- ❌ **Rojo**: Usuario no autenticado

### 4. Logs de Debug

Revisa la consola del navegador para ver los logs detallados:
- `🔍 [Funciones] Verificando autenticación inicial...`
- `✅ [Funciones] Usuario autenticado: email@ejemplo.com`
- `❌ Error de autenticación: [detalles del error]`

## 🚨 Si el Problema Persiste

1. **Verifica las variables de entorno**: Asegúrate de que `REACT_APP_SUPABASE_URL` y `REACT_APP_SUPABASE_ANON_KEY` estén configuradas correctamente

2. **Revisa las políticas RLS**: La tabla `funciones` puede tener políticas de Row Level Security que requieren autenticación específica

3. **Contacta al administrador**: Si nada funciona, puede ser un problema de configuración del servidor o permisos de base de datos

## 📝 Notas Técnicas

- El error 401 indica que la petición no tiene autorización válida
- Supabase usa JWT tokens para autenticación
- Las políticas RLS pueden bloquear el acceso si el usuario no está autenticado correctamente
- El token se almacena en localStorage y debe ser válido y no expirado
