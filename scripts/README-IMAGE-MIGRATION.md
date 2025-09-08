# 🖼️ Migración de Imágenes a Estructura por Tenant

## 📋 Resumen

Este conjunto de scripts migra las imágenes de eventos desde el bucket `eventos` a una nueva estructura organizada por `tenant_id` (empresa), mejorando la organización y escalabilidad del sistema.

## 🏗️ Nueva Estructura

### Opción 1: Estructura en Bucket Único
```
eventos/
├── {tenant_id}/
│   ├── {event_id}/
│   │   ├── banner.jpg
│   │   ├── portada.jpg
│   │   └── obraImagen.jpg
│   └── ...
└── ...
```

### Opción 2: Buckets Separados por Tenant (Recomendado)
```
tenant-{tenant_id}/
├── {event_id}/
│   ├── banner.jpg
│   ├── portada.jpg
│   └── obraImagen.jpg
└── ...
```

## 🚀 Scripts Disponibles

### 1. `migrate-images-to-tenant-structure.js`
Migra imágenes a la estructura en bucket único:
```bash
node scripts/migrate-images-to-tenant-structure.js
```

**Características:**
- ✅ Reorganiza imágenes por `tenant_id/event_id/`
- ✅ Actualiza referencias en la base de datos
- ✅ Mantiene compatibilidad con estructura existente
- ✅ Logging detallado del proceso

### 2. `create-tenant-buckets.js`
Crea buckets separados por tenant:
```bash
node scripts/create-tenant-buckets.js
```

**Características:**
- ✅ Crea bucket `tenant-{tenant_id}` para cada empresa
- ✅ Establece permisos públicos y límites de tamaño
- ✅ Crea estructura de carpetas por evento
- ✅ Migra imágenes automáticamente

## 📝 Variables de Entorno Requeridas

Asegúrate de tener estas variables en tu `.env`:

```env
REACT_APP_SUPABASE_URL=tu_url_de_supabase
REACT_APP_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## 🔧 Cambios en el Código

### 1. `resolveImageUrl.js` Actualizado
- ✅ Soporte para estructura `tenant_id/event_id/`
- ✅ Soporte para buckets por tenant
- ✅ Funciones específicas para eventos
- ✅ Fallbacks automáticos

### 2. `EventImage.jsx` Mejorado
- ✅ Integración con `TenantContext`
- ✅ Uso automático de nueva estructura
- ✅ Debug info mejorado
- ✅ Manejo de errores robusto

## 🎯 Beneficios de la Nueva Estructura

### **Para Desarrolladores:**
- 🗂️ **Organización clara** por empresa y evento
- 🔍 **Fácil debugging** con rutas descriptivas
- 📊 **Mejor escalabilidad** para múltiples tenants
- 🛠️ **APIs más intuitivas** para gestión de imágenes

### **Para Administradores:**
- 🏢 **Separación por empresa** en buckets independientes
- 📈 **Mejor rendimiento** con buckets específicos
- 🔒 **Control de acceso** granular por tenant
- 💾 **Gestión de almacenamiento** más eficiente

### **Para Usuarios:**
- ⚡ **Carga más rápida** de imágenes
- 🖼️ **Mejor calidad** de visualización
- 📱 **Optimización móvil** mejorada
- 🔄 **Fallbacks automáticos** cuando no hay imágenes

## 🚨 Consideraciones Importantes

### **Antes de Ejecutar:**
1. ✅ **Backup completo** de la base de datos
2. ✅ **Backup del bucket** `eventos` en Supabase
3. ✅ **Verificar permisos** de Service Role Key
4. ✅ **Probar en entorno** de desarrollo primero

### **Durante la Migración:**
1. 🔍 **Monitorear logs** del proceso
2. ⏱️ **Tiempo estimado**: 5-15 minutos por tenant
3. 📊 **Verificar progreso** en Supabase Storage
4. 🛑 **Detener si hay errores** críticos

### **Después de la Migración:**
1. ✅ **Verificar imágenes** en la aplicación
2. 🧹 **Limpiar imágenes** antiguas (opcional)
3. 📝 **Actualizar documentación** del equipo
4. 🚀 **Desplegar cambios** en producción

## 🔄 Proceso de Migración Paso a Paso

### **Paso 1: Preparación**
```bash
# 1. Verificar variables de entorno
echo $REACT_APP_SUPABASE_URL
echo $REACT_APP_SUPABASE_SERVICE_ROLE_KEY

# 2. Hacer backup
# (Usar herramientas de Supabase o scripts personalizados)
```

### **Paso 2: Ejecutar Migración**
```bash
# Opción A: Estructura en bucket único
node scripts/migrate-images-to-tenant-structure.js

# Opción B: Buckets separados (Recomendado)
node scripts/create-tenant-buckets.js
```

### **Paso 3: Verificación**
```bash
# 1. Verificar en Supabase Storage
# 2. Probar carga de imágenes en la app
# 3. Verificar logs de la aplicación
```

### **Paso 4: Limpieza (Opcional)**
```bash
# Eliminar imágenes antiguas del bucket 'eventos'
# (Solo después de verificar que todo funciona)
```

## 🐛 Solución de Problemas

### **Error: "Service Role Key no válida"**
- Verificar que la key tenga permisos de Storage
- Comprobar que no esté expirada

### **Error: "Bucket ya existe"**
- Normal, el script continúa automáticamente
- Verificar que el bucket tenga los permisos correctos

### **Error: "Imagen no encontrada"**
- Verificar que la imagen exista en el bucket original
- Comprobar la ruta en la base de datos

### **Error: "Permisos insuficientes"**
- Verificar políticas RLS en Supabase
- Comprobar permisos del Service Role

## 📞 Soporte

Si encuentras problemas durante la migración:

1. 🔍 **Revisar logs** detallados del script
2. 📊 **Verificar estado** en Supabase Dashboard
3. 🛠️ **Probar en desarrollo** antes de producción
4. 📝 **Documentar errores** específicos encontrados

---

**¡La nueva estructura mejorará significativamente la organización y rendimiento de las imágenes!** 🎉
