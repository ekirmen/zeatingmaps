# 🗺️ Cómo resolver mapas en blanco

## 🐛 **Problema**
Las páginas de mapas de asientos muestran contenido en blanco cuando:
- No existe mapa para la sala
- No existen zonas para la sala
- La estructura del mapa no es compatible con el frontend

## 🔍 **Diagnóstico**

### **1. Verificar si existe mapa:**
```sql
SELECT 
    m.id,
    m.sala_id,
    jsonb_typeof(m.contenido) as tipo_contenido,
    jsonb_array_length(m.contenido) as elementos_contenido
FROM mapas m
WHERE m.sala_id = {SALA_ID};
```

### **2. Verificar si existen zonas:**
```sql
SELECT 
    z.id,
    z.nombre,
    z.sala_id,
    z.aforo,
    z.color
FROM zonas z
WHERE z.sala_id = '{SALA_ID}';
```

### **3. Verificar estructura del mapa:**
```sql
SELECT 
    jsonb_array_elements(m.contenido)->>'type' as tipo_elemento,
    COUNT(*) as cantidad
FROM mapas m
WHERE m.sala_id = {SALA_ID}
GROUP BY jsonb_array_elements(m.contenido)->>'type';
```

## 🛠️ **Solución**

### **Problema 1: Mapa no existe**
Crear mapa con estructura compatible con `SeatingMapUnified`:

```sql
INSERT INTO mapas (sala_id, contenido)
SELECT {SALA_ID}, 
    '[
        {
            "_id": "zona_{ZONA_ID}",
            "type": "zona",
            "id": {ZONA_ID},
            "nombre": "Zona General",
            "color": "#4CAF50",
            "asientos": [
                {
                    "_id": "silla_1",
                    "nombre": "1",
                    "x": 100,
                    "y": 100,
                    "ancho": 30,
                    "alto": 30,
                    "zona": {ZONA_ID},
                    "estado": "disponible"
                }
            ]
        }
    ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM mapas WHERE sala_id = {SALA_ID});
```

### **Problema 2: Zona no existe**
Crear zona para la sala:

```sql
INSERT INTO zonas (id, nombre, aforo, color, numerada, sala_id)
SELECT {ZONA_ID}, 'General', 100, '#4CAF50', true, '{SALA_ID}'
WHERE NOT EXISTS (SELECT 1 FROM zonas WHERE sala_id = '{SALA_ID}');
```

### **Problema 3: Estructura incompatible**
El frontend `SeatingMapUnified` espera:
- `mapa.contenido.zonas` (no `mapa.contenido` directo)
- `asientos` con propiedades `x`, `y`, `ancho`, `alto`
- No `sillas` con `posicion`

## 🔧 **Plantilla segura**

Usa `sql/fix_blank_maps_template.sql` como plantilla:
1. Reemplaza `{SALA_ID}` con el ID real de la sala
2. Reemplaza `{ZONA_ID}` con el ID de zona deseado
3. Descomenta las secciones necesarias
4. Ejecuta el script

## 🎯 **Verificación**

### **Después de aplicar la corrección:**
1. **Verificar que el mapa existe:**
   ```sql
   SELECT COUNT(*) FROM mapas WHERE sala_id = {SALA_ID};
   ```

2. **Verificar que la zona existe:**
   ```sql
   SELECT COUNT(*) FROM zonas WHERE sala_id = '{SALA_ID}';
   ```

3. **Probar las páginas:**
   - `https://tu-dominio.com/store/eventos/{slug}/map?funcion={ID}`
   - Debería mostrar el mapa de asientos

## 🚨 **Errores comunes**

### **Error: "Cannot read properties of undefined (reading 'length')"**
- **Causa**: El frontend no puede acceder a `mapa.contenido.zonas`
- **Solución**: Verificar que `fetchMapa` devuelve la estructura correcta

### **Error: "No map data available"**
- **Causa**: No existe mapa o la estructura es incorrecta
- **Solución**: Crear mapa con estructura compatible

### **Error: "zonas.length === 0"**
- **Causa**: No existen zonas para la sala
- **Solución**: Crear zona para la sala

## 📋 **Checklist de corrección**

- [ ] Verificar que existe mapa para la sala
- [ ] Verificar que existe zona para la sala
- [ ] Verificar que la estructura del mapa es compatible
- [ ] Verificar que `fetchMapa` devuelve estructura correcta
- [ ] Probar las páginas después de la corrección

## 🔗 **Archivos relacionados**

- `src/components/SeatingMapUnified.jsx` - Componente que renderiza el mapa
- `src/store/services/apistore.js` - Función `fetchMapa`
- `sql/fix_blank_maps_template.sql` - Plantilla segura para corrección

---

**Nota**: Usa siempre plantillas seguras sin datos específicos para documentación en GitHub. 