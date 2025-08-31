# 🎨 Solución para "No hay eventos disponibles" en EventThemePanel

## 🔍 **Problema Identificado**

Cuando vas a `/dashboard/webcolors` y haces clic en la pestaña "Colores por Evento", aparece el mensaje **"No hay eventos disponibles"**. Esto sucede porque:

1. **No hay eventos en la base de datos** para el tenant actual
2. **Los eventos no tienen `tenant_id`** configurado correctamente
3. **Las políticas RLS están bloqueando** el acceso a los eventos
4. **La tabla `event_theme_settings` no existe** o no está configurada

## 🛠️ **Soluciones Disponibles**

### **Opción 1: Script de Diagnóstico (Recomendado primero)**

Ejecuta el script de debug para identificar exactamente qué está pasando:

```bash
# Conectar a tu base de datos Supabase
psql "postgresql://postgres:[TU_PASSWORD]@db.[TU_PROJECT_REF].supabase.co:5432/postgres"

# Ejecutar el script de diagnóstico
\i scripts/debug-event-theme-issue.sql
```

Este script te mostrará:
- ✅ Si las tablas existen
- 📊 Cuántos eventos hay en la base de datos
- 🔐 Qué políticas RLS están configuradas
- 👤 Qué permisos tiene el usuario actual

### **Opción 2: Script de Reparación Automática**

Si quieres arreglar el problema directamente:

```bash
# Ejecutar el script de reparación
\i scripts/fix-event-theme-issue.sql
```

Este script:
- ✅ Crea la tabla `event_theme_settings` si no existe
- 🔐 Configura las políticas RLS correctamente
- 📝 Crea un evento de prueba si no hay eventos
- 🎨 Crea una configuración de tema de ejemplo
- 🔧 Configura todos los triggers y funciones necesarias

## 🚀 **Pasos para Verificar la Solución**

1. **Ejecuta uno de los scripts** (diagnóstico o reparación)
2. **Ve a** `/dashboard/webcolors`
3. **Haz clic en** "Colores por Evento"
4. **Verifica que aparezcan eventos** en lugar de "No hay eventos disponibles"

## 🔧 **Solución Manual (Si los scripts no funcionan)**

### **1. Verificar que la tabla existe**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'event_theme_settings';
```

### **2. Verificar que hay eventos**
```sql
SELECT COUNT(*) FROM eventos;
```

### **3. Verificar que los eventos tienen tenant_id**
```sql
SELECT id, nombre, tenant_id FROM eventos LIMIT 5;
```

### **4. Crear un evento de prueba**
```sql
INSERT INTO eventos (
  nombre, 
  fecha_evento, 
  tenant_id, 
  activo, 
  oculto
) VALUES (
  'Evento de Prueba',
  NOW() + INTERVAL '30 days',
  (SELECT id FROM tenants LIMIT 1),
  true,
  false
);
```

## 📋 **Estructura Esperada**

Después de ejecutar los scripts, deberías tener:

- ✅ **Tabla `event_theme_settings`** con políticas RLS
- ✅ **Al menos un evento** en la tabla `eventos`
- ✅ **Al menos una configuración de tema** en `event_theme_settings`
- ✅ **Políticas RLS** que permitan acceso al tenant actual

## 🆘 **Si el Problema Persiste**

1. **Revisa los logs** de la consola del navegador
2. **Verifica que el usuario esté autenticado** correctamente
3. **Confirma que el `tenant_id` en el JWT** coincida con el de los eventos
4. **Ejecuta el script de diagnóstico** para más detalles

## 📞 **Soporte**

Si necesitas ayuda adicional:
1. Ejecuta el script de diagnóstico
2. Comparte los resultados
3. Revisa los logs de la consola del navegador
4. Verifica que estés usando el tenant correcto
