# Optimización de Mapas - Guía de Aplicación

## 🚨 Problema Identificado

El problema de rendimiento en la tabla `mapas` **NO** está en el campo `imagen_fondo` (que está NULL), sino en el campo `contenido` que contiene:

- **5.5 MB de datos JSONB** con imágenes base64
- Campo `imageData` con imágenes JPEG en base64
- Más de 10,000 líneas de código que causan problemas de tokenización

## 📊 Análisis de Resultados

```
total_mapas: 1
avg_imagen_fondo_size: NULL
max_imagen_fondo_size: NULL  
min_imagen_fondo_size: NULL
avg_contenido_size: 5,516,237 bytes (≈5.5 MB)
max_contenido_size: 5,516,237 bytes (≈5.5 MB)
```

## 🛠️ Solución Implementada

### 1. **Extracción de Imágenes**
- Crear tabla separada `mapas_imagenes_fondo` para almacenar imágenes
- Extraer `imageData` del campo `contenido`
- Reemplazar con referencia `imageDataRef`

### 2. **Compresión de Imágenes**
- Mantener imagen original completa en tabla separada
- Crear versión comprimida para uso normal
- Reducir tamaño de preview a 50KB máximo

### 3. **Funciones de Gestión**
- `extract_and_compress_image_data()` - Extrae y comprime imágenes
- `migrate_mapas_with_image_data()` - Migra mapas existentes
- `restore_mapa_imagen_completa_for_editing()` - Restaura imagen completa para edición
- `get_mapa_imagen_original()` - Obtiene imagen original
- `get_mapa_imagen_compressed()` - Obtiene imagen comprimida

## 📋 Pasos para Aplicar la Optimización

### **PASO 1: Crear Estructura de Optimización**
```sql
-- Ejecutar en Supabase SQL Editor
-- Archivo: scripts/optimize-mapas-image-data.sql
```

### **PASO 2: Aplicar Migración**
```sql
-- Ejecutar en Supabase SQL Editor
-- Archivo: scripts/migrate-mapas-image-optimization.sql
```

### **PASO 3: Verificar Resultados**
```sql
-- Ejecutar en Supabase SQL Editor
-- Archivo: scripts/apply-mapas-optimization-step-by-step.sql
```

### **PASO 4: Probar Funcionalidad**
```bash
# Ejecutar en terminal
node scripts/test-mapas-optimization.js
```

## 🎯 Beneficios Esperados

### **Antes de la Optimización:**
- Contenido: 5.5 MB por mapa
- Problemas de tokenización con 10,000+ líneas
- Lento rendimiento en consultas
- Problemas de memoria en el editor

### **Después de la Optimización:**
- Contenido: ~50KB por mapa (99% reducción)
- Sin problemas de tokenización
- Consultas rápidas
- Editor responsivo
- Imágenes accesibles cuando sea necesario

## 🔧 Funciones Disponibles

### **Para Desarrollo/Edición:**
```sql
-- Restaurar imagen completa para edición
SELECT restore_mapa_imagen_completa_for_editing(1);

-- Optimizar después de edición
SELECT optimize_mapa_after_editing(1, nuevo_contenido);
```

### **Para Consultas:**
```sql
-- Obtener imagen original
SELECT get_mapa_imagen_original(1, 'bg_1755825719428');

-- Obtener imagen comprimida
SELECT get_mapa_imagen_compressed(1, 'bg_1755825719428');
```

### **Para Monitoreo:**
```sql
-- Estadísticas de rendimiento
SELECT * FROM get_mapas_image_performance_stats();

-- Vista de monitoreo
SELECT * FROM mapas_performance_monitor;
```

## 🚀 Aplicación en Producción

### **1. Backup de Seguridad**
- Se crea automáticamente `mapas_backup_before_optimization`
- Contiene contenido original antes de la optimización

### **2. Migración Gradual**
- Solo se procesan mapas con `imageData`
- Mapas sin imágenes permanecen sin cambios
- Proceso reversible

### **3. Monitoreo Continuo**
- Vista `mapas_performance_monitor` para seguimiento
- Función `get_mapas_image_performance_stats()` para estadísticas
- Limpieza automática de imágenes obsoletas

## ⚠️ Consideraciones Importantes

### **1. Compatibilidad**
- El frontend debe manejar `imageDataRef` en lugar de `imageData`
- Implementar función para restaurar imagen cuando sea necesario
- Mantener compatibilidad con mapas existentes

### **2. Rendimiento**
- Las consultas serán significativamente más rápidas
- El editor no tendrá problemas de tokenización
- Las imágenes se cargan bajo demanda

### **3. Almacenamiento**
- Reducción del 99% en tamaño de contenido
- Imágenes originales preservadas en tabla separada
- Compresión inteligente para diferentes tipos de imagen

## 🔍 Verificación Post-Aplicación

### **1. Verificar Reducción de Tamaño**
```sql
SELECT 
  ROUND(SUM(LENGTH(contenido::text)) / 1024.0 / 1024.0, 2) as tamaño_actual_mb
FROM mapas;
```

### **2. Verificar Funcionalidad**
```sql
SELECT * FROM get_mapas_image_performance_stats();
```

### **3. Verificar Sin Problemas de Tokenización**
- Abrir el mapa en el editor
- Verificar que no hay warnings de tokenización
- Confirmar que el editor es responsivo

## 📞 Soporte

Si encuentras problemas durante la aplicación:

1. **Verificar backup**: `mapas_backup_before_optimization`
2. **Revisar logs**: Ejecutar `test-mapas-optimization.js`
3. **Restaurar si es necesario**: Usar backup para revertir cambios
4. **Contactar soporte**: Con logs específicos del error

---

**¡La optimización está lista para aplicar! 🚀**
