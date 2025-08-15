# 🚀 Guía de Instalación: Sistema de PDFs con Imágenes

## ⚠️ PROBLEMA IDENTIFICADO

Has encontrado este error:
```
ERROR: 42804: foreign key constraint "recinto_imagenes_recinto_id_fkey" cannot be implemented
DETAIL: Key columns "recinto_id" and "id" are of incompatible types: uuid and integer.
```

## 🔍 DIAGNÓSTICO

El problema es que las tablas `eventos` y `recintos` en tu base de datos tienen campos `id` de tipo `integer` en lugar de `UUID`, pero nuestro sistema está diseñado para trabajar con `UUID`.

## 🛠️ SOLUCIÓN PASO A PASO

### **PASO 1: Ejecutar Script de Diagnóstico y Corrección**

```bash
# Ejecuta este script primero para corregir los tipos de datos
psql -d tu_base_de_datos -f fix_database_types.sql
```

**O si usas Supabase:**
```sql
-- Copia y pega el contenido de fix_database_types.sql en tu SQL Editor
```

### **PASO 2: Verificar que las Correcciones Funcionaron**

Después de ejecutar el script anterior, deberías ver:
- ✅ Tabla `eventos` con campo `id` de tipo `UUID`
- ✅ Tabla `recintos` con campo `id` de tipo `UUID`
- ✅ Mensaje: "Script de corrección completado exitosamente"

### **PASO 3: Crear las Tablas de Imágenes**

```bash
# Ahora ejecuta el script corregido
psql -d tu_base_de_datos -f create_image_tables.sql
```

**O si usas Supabase:**
```sql
-- Copia y pega el contenido de create_image_tables.sql en tu SQL Editor
```

### **PASO 4: Instalar Dependencias de Node.js**

```bash
cd api
npm install pdf-lib qrcode
```

### **PASO 5: Verificar la Instalación**

```bash
# Verifica que las tablas se crearon correctamente
psql -d tu_base_de_datos -c "\d evento_imagenes"
psql -d tu_base_de_datos -c "\d recinto_imagenes"
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

---

**¡Con esta guía deberías poder resolver el problema de tipos de datos y tener tu sistema de PDFs con imágenes funcionando perfectamente!** 🎉
