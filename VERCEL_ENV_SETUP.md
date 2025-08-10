# 🚀 Configuración de Vercel para Despliegue

## 📋 Variables de Entorno Requeridas en Vercel

### **Frontend (React) Variables:**
```
REACT_APP_SUPABASE_URL=tu_url_de_supabase
REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio_de_supabase
```

### **Backend (API Routes) Variables:**
```
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio_de_supabase
```

## 🔧 Cómo Configurar en Vercel Dashboard:

1. **Ve a tu proyecto en Vercel**
2. **Settings → Environment Variables**
3. **Agrega cada variable:**
   - `REACT_APP_SUPABASE_URL` → `https://tu-proyecto.supabase.co`
   - `REACT_APP_SUPABASE_ANON_KEY` → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `REACT_APP_SUPABASE_SERVICE_ROLE_KEY` → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `SUPABASE_URL` → `https://tu-proyecto.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🌍 Entornos de Despliegue:

- **Production**: Todas las variables
- **Preview**: Todas las variables
- **Development**: No es necesario (usa .env.local localmente)

## ✅ Verificación Post-Despliegue:

1. **Frontend**: Debe cargar sin errores de Supabase
2. **API Routes**: `/api/mapas/[salaId]` debe funcionar
3. **Persistencia**: Los cambios en el mapa deben guardarse
4. **Carga**: El mapa debe cargar correctamente al refrescar

## 🚨 Problemas Comunes:

- **Error 500**: Verificar `SUPABASE_SERVICE_ROLE_KEY` en API routes
- **Error de conexión**: Verificar `SUPABASE_URL`
- **Mapa no carga**: Verificar permisos de RLS en Supabase
- **No se guardan cambios**: Verificar `SUPABASE_SERVICE_ROLE_KEY`

## 🔒 Seguridad:

- **NUNCA** expongas `SERVICE_ROLE_KEY` en el frontend
- **SÍ** usa `SERVICE_ROLE_KEY` en las API routes del backend
- **SÍ** usa `ANON_KEY` en el frontend
