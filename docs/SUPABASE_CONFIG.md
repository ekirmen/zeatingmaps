# 🔧 Configuración de Supabase para Frontend

## 📋 Variables de Entorno Requeridas

### **Archivo `.env.local` (desarrollo local):**
```bash
REACT_APP_SUPABASE_URL=https://tu-proyecto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔑 Cómo Obtener las Claves

### **1. Ir a Supabase Dashboard:**
- Ve a [supabase.com](https://supabase.com)
- Selecciona tu proyecto
- Ve a **Settings → API**

### **2. Copiar las Claves:**
- **Project URL**: `REACT_APP_SUPABASE_URL`
- **anon public**: `REACT_APP_SUPABASE_ANON_KEY`
- **service_role secret**: `REACT_APP_SUPABASE_SERVICE_ROLE_KEY`

## 🚨 Solución de Problemas

### **Error: "Service role key no encontrada"**
- Verifica que `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` esté en `.env.local`
- Reinicia el servidor de desarrollo después de agregar variables

### **Error de Conexión**
- Verifica que `REACT_APP_SUPABASE_URL` sea correcta
- Asegúrate de que el proyecto esté activo en Supabase

### **Error de Autenticación**
- Verifica que `REACT_APP_SUPABASE_ANON_KEY` sea correcta
- Revisa los permisos RLS en tu base de datos

## 🔒 Seguridad

- **NUNCA** commits `.env.local` al repositorio
- **SÍ** usa `.env.example` para documentar variables requeridas
- **SÍ** configura variables en Vercel para producción

## 📁 Estructura de Archivos

```
.env.local          # Variables locales (NO committear)
.env.example        # Ejemplo de variables (SÍ committear)
docs/
  SUPABASE_CONFIG.md # Esta documentación
```

## ✅ Verificación

1. **Crear `.env.local`** con las variables
2. **Reiniciar servidor** de desarrollo
3. **Verificar consola** - no debe haber errores de Supabase
4. **Probar funcionalidad** del mapa
