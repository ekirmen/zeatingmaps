# 🚀 Configuración de veneventos.com con Vercel

## 📋 Resumen de la Solución

**NO necesitas SSL comodín** para hacer pruebas. Te recomiendo usar un subdominio específico como `test.veneventos.com` que es más simple y económico.

## 🔧 Pasos para Configurar

### **Paso 1: Crear Tenant en Supabase**

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Ejecuta este script:

```sql
-- Crear tenant para test.veneventos.com
INSERT INTO tenants (
    subdomain,
    company_name,
    contact_email,
    status,
    plan_type,
    settings
) VALUES (
    'test',
    'Veneventos - Empresa de Prueba',
    'test@veneventos.com',
    'active',
    'premium',
    '{"theme": "default", "features": ["ticketing", "maps", "analytics"]}'
) ON CONFLICT (subdomain) 
DO UPDATE SET
    company_name = EXCLUDED.company_name,
    contact_email = EXCLUDED.contact_email,
    status = EXCLUDED.status,
    plan_type = EXCLUDED.plan_type,
    settings = EXCLUDED.settings,
    updated_at = NOW();
```

### **Paso 2: Configurar DNS**

En tu panel de DNS (donde tengas veneventos.com):

```
Tipo: CNAME
Nombre: test
Valor: cname.vercel-dns.com
TTL: 3600 (o el valor por defecto)
```

**Resultado:** `test.veneventos.com` apuntará a Vercel

### **Paso 3: Configurar en Vercel**

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en **Settings** → **Domains**
3. Agrega: `test.veneventos.com`
4. Vercel generará el SSL automáticamente (gratis)

### **Paso 4: Desplegar**

```bash
# En tu terminal local
npm run build
vercel --prod
```

## 🌐 URLs de Prueba

Una vez configurado, podrás acceder a:

- **Frontend:** `https://test.veneventos.com/store`
- **Backoffice:** `https://test.veneventos.com/backoffice`
- **Panel SaaS:** `https://test.veneventos.com/backoffice/saas/diagnostico`

## 💰 Costos

- **Subdominio simple:** ✅ Gratis
- **SSL:** ✅ Gratis (Vercel lo genera automáticamente)
- **Hosting:** ✅ Incluido en tu plan de Vercel

## 🔒 Seguridad

- ✅ HTTPS automático
- ✅ SSL válido
- ✅ Headers de seguridad configurados
- ✅ Protección contra ataques comunes

## 🚨 Solución de Problemas

### **Error: "No se encontró empresa configurada"**
1. Verifica que ejecutaste el script SQL en Supabase
2. Confirma que el tenant tiene `status = 'active'`
3. Verifica que el subdominio en la base de datos es exactamente `test`

### **Error: "Dominio no configurado en Vercel"**
1. Ve a Vercel Dashboard → Settings → Domains
2. Agrega `test.veneventos.com`
3. Espera a que se propague el DNS (puede tomar hasta 24 horas)

### **Error: "SSL no válido"**
1. Vercel genera SSL automáticamente
2. Espera 5-10 minutos después de configurar el dominio
3. Verifica que el DNS esté apuntando correctamente

## 📱 Próximos Pasos

1. **Configura el subdominio** siguiendo esta guía
2. **Prueba la aplicación** en `test.veneventos.com`
3. **Si funciona bien**, puedes crear más subdominios:
   - `demo.veneventos.com`
   - `cliente1.veneventos.com`
   - `cliente2.veneventos.com`

## 🎯 Ventajas de esta Configuración

- ✅ **Sin SSL comodín** (más económico)
- ✅ **Configuración simple** (DNS + Vercel)
- ✅ **Escalable** (puedes agregar más subdominios)
- ✅ **Profesional** (cada cliente tiene su URL)
- ✅ **Mantenimiento fácil** (todo centralizado en Vercel)

## 📞 Soporte

Si tienes problemas:
1. Verifica los logs en Vercel Dashboard
2. Revisa la consola del navegador
3. Ejecuta el script de diagnóstico: `node scripts/diagnose-tenant-issue.js`
