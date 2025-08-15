# 🚀 Guía de Instalación: Sistema de PDFs con Imágenes

## ⚠️ PROBLEMAS IDENTIFICADOS

### **Error 1: Incompatibilidad de Tipos**
```
ERROR: 42804: foreign key constraint "recinto_imagenes_recinto_id_fkey" cannot be implemented
DETAIL: Key columns "recinto_id" and "id" are of incompatible types: uuid and integer.
```

### **Error 2: Campos Inexistentes**
```
ERROR: 42703: column "created_at" does not exist
DETAIL: There is a column named "created_at" in table "recintos_temp", but it cannot be referenced from this part of the query.
```

### **Error 3: Políticas RLS Duplicadas** ⭐ **NUEVO**
```
ERROR: 42710: policy "Users can view event images" for table "evento_imagenes" already exists
ERROR: 42710: policy "Users can view event images" for table "evento_imagenes" already exists
```

## 🔍 DIAGNÓSTICO

El problema es que las tablas `eventos` y `recintos` en tu base de datos:
1. **Tienen campos `id` de tipo `integer`** en lugar de `UUID`
2. **No tienen todos los campos esperados** como `created_at`, `updated_at`
3. **Ya tienen políticas RLS duplicadas** de ejecuciones anteriores
4. **Nuestro sistema está diseñado** para trabajar con `UUID` y campos completos

## 🛠️ SOLUCIÓN PASO A PASO

### **PASO 1: Limpiar Políticas RLS Duplicadas** ⭐ **PRIMERO**

**Ejecuta este script para limpiar políticas duplicadas:**
```sql
-- Copia y pega el contenido de cleanup_duplicate_policies.sql en tu SQL Editor
-- Este script eliminará políticas duplicadas y creará unas limpias
```

**¿Por qué este paso es necesario?**
- ✅ **Elimina políticas duplicadas** que causan conflictos
- ✅ **Crea políticas limpias** y consistentes
- ✅ **Prepara el sistema** para la instalación correcta

### **PASO 2: Ejecutar Script Simple de Corrección**

**Usa este script corregido:**
```sql
-- Copia y pega el contenido de fix_database_types_simple.sql en tu SQL Editor
```

**¿Por qué este script es mejor?**
- ✅ **No intenta copiar campos inexistentes**
- ✅ **Crea tablas nuevas con estructura correcta**
- ✅ **Migra solo los datos disponibles**
- ✅ **Maneja errores de manera segura**

### **PASO 3: Verificar que las Correcciones Funcionaron**

Después de ejecutar ambos scripts deberías ver:
- ✅ **Mensaje**: "LIMPIEZA DE POLÍTICAS COMPLETADA"
- ✅ **Mensaje**: "SCRIPT DE CORRECCIÓN COMPLETADO EXITOSAMENTE"
- ✅ **Tabla `eventos`** con campo `id` de tipo `UUID`
- ✅ **Tabla `recintos`** con campo `id` de tipo `UUID`
- ✅ **Estructura completa** con todos los campos necesarios

### **PASO 4: Crear las Tablas de Imágenes**

```sql
-- Ahora ejecuta el script corregido
-- Copia y pega el contenido de create_image_tables.sql en tu SQL Editor
```

**Este script ahora:**
- ✅ **Verifica políticas existentes** antes de crearlas
- ✅ **No crea duplicados** de políticas RLS
- ✅ **Maneja triggers** de manera segura
- ✅ **Incluye mensajes** de éxito claros

### **PASO 5: Instalar Dependencias de Node.js**

```bash
cd api
npm install pdf-lib qrcode
```

### **PASO 6: Verificar la Instalación**

```sql
-- Verifica que las tablas se crearon correctamente
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('evento_imagenes', 'recinto_imagenes');

-- Verifica tipos de datos
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('evento_imagenes', 'recinto_imagenes')
ORDER BY table_name, ordinal_position;

-- Verifica políticas RLS
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('evento_imagenes', 'recinto_imagenes');
```

## 🔧 ALTERNATIVA: Si No Puedes Cambiar los Tipos de Datos

Si por alguna razón no puedes cambiar los tipos de datos existentes, modifica `create_image_tables.sql`:

```sql
-- Cambiar estas líneas:
evento_id UUID NOT NULL,
recinto_id UUID NOT NULL,

-- Por estas:
evento_id INTEGER NOT NULL,
recinto_id INTEGER NOT NULL,
```

Y luego ajustar las referencias:
```sql
FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
FOREIGN KEY (recinto_id) REFERENCES recintos(id) ON DELETE CASCADE,
```

## 📋 VERIFICACIÓN FINAL

### **1. Estructura de Base de Datos**
```sql
-- Verificar que las tablas existen
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('evento_imagenes', 'recinto_imagenes');

-- Verificar tipos de datos
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('evento_imagenes', 'recinto_imagenes')
ORDER BY table_name, ordinal_position;
```

### **2. Verificar Endpoints de API**
```bash
# Probar endpoint básico
curl -H "Authorization: Bearer TU_TOKEN" \
     "http://localhost:3000/api/payments/LOCATOR/download"

# Probar endpoint con imágenes
curl -H "Authorization: Bearer TU_TOKEN" \
     "http://localhost:3000/api/payments/LOCATOR/download-enhanced"
```

### **3. Verificar Componentes Frontend**
- ✅ `ImageManager` se renderiza correctamente
- ✅ Puedes agregar/editar imágenes
- ✅ Las imágenes se muestran en el backoffice

## 🚨 SOLUCIÓN DE PROBLEMAS COMUNES

### **Error: "policy already exists"**
```sql
-- Ejecuta cleanup_duplicate_policies.sql primero
-- Este script eliminará políticas duplicadas
```

### **Error: "column does not exist"**
```sql
-- Verificar qué campos tiene realmente la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recintos'
ORDER BY ordinal_position;
```

### **Error: "relation does not exist"**
```sql
-- Verificar que las tablas base existen
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('eventos', 'recintos');
```

### **Error: "permission denied"**
```sql
-- Verificar permisos RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('evento_imagenes', 'recinto_imagenes');
```

### **Error: "function does not exist"**
```sql
-- Verificar que las funciones están creadas
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column';
```

## 📱 PRUEBAS DEL SISTEMA

### **1. Agregar Imagen de Prueba**
```sql
-- Insertar imagen de prueba para un evento
INSERT INTO evento_imagenes (evento_id, url, alt_text, tipo, orden) 
VALUES (
  (SELECT id FROM eventos LIMIT 1),
  'https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=Evento+Test',
  'Imagen de prueba del evento',
  'principal',
  1
);
```

### **2. Generar PDF de Prueba**
```javascript
// En el frontend, usar el botón de descarga
const response = await fetch(`/api/payments/${locator}/download-enhanced`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.ok) {
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ticket-${locator}-enhanced.pdf`;
  a.click();
}
```

## 🎯 ESTADO ESPERADO DESPUÉS DE LA INSTALACIÓN

✅ **Base de datos:**
- Tablas `evento_imagenes` y `recinto_imagenes` creadas
- Foreign keys funcionando correctamente
- RLS habilitado y políticas configuradas
- **Sin políticas duplicadas**

✅ **API:**
- Endpoint `/api/payments/[locator]/download` funcionando
- Endpoint `/api/payments/[locator]/download-enhanced` funcionando
- Generación de PDFs con imágenes

✅ **Frontend:**
- Componente `ImageManager` funcionando
- Gestión de imágenes para eventos y recintos
- Vista previa de imágenes en tiempo real

## 🆘 CONTACTO Y SOPORTE

Si sigues teniendo problemas después de seguir esta guía:

1. **Revisa los logs** del servidor para errores específicos
2. **Verifica la consola** del navegador para errores de JavaScript
3. **Comprueba la consola** de la base de datos para errores SQL
4. **Ejecuta los scripts de diagnóstico** para identificar problemas

## 📝 RESUMEN DE ARCHIVOS

### **Scripts de Limpieza:**
1. **`cleanup_duplicate_policies.sql`** ⭐ **NUEVO** - Limpia políticas RLS duplicadas

### **Scripts de Corrección:**
2. **`fix_database_types_simple.sql`** ⭐ **RECOMENDADO** - Script simple y seguro
3. **`fix_database_types.sql`** - Script completo con diagnóstico

### **Scripts de Imágenes:**
4. **`create_image_tables.sql`** - Crear tablas de imágenes (corregido)

### **Documentación:**
5. **`INSTALACION_PDFS_IMAGENES.md`** - Esta guía completa

## 🚀 ORDEN DE EJECUCIÓN RECOMENDADO

1. **`cleanup_duplicate_policies.sql`** ⭐ **PRIMERO** - Limpiar políticas duplicadas
2. **`fix_database_types_simple.sql`** ⭐ **SEGUNDO** - Corregir tipos de datos
3. **`create_image_tables.sql`** ⭐ **TERCERO** - Crear tablas de imágenes
4. **Instalar dependencias** de Node.js
5. **Probar el sistema** completo

---

**¡Con esta guía actualizada deberías poder resolver todos los problemas: tipos de datos, campos inexistentes y políticas duplicadas!** 🎉

**Recomendación**: Sigue el orden de ejecución recomendado para evitar conflictos.
