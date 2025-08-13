# Solución al Error de Tipos de Datos en SQL

## Problema Identificado

**Error:** `42883: operator does not exist: text = integer`

**Ubicación:** Línea 20 en consultas SQL que hacen JOIN entre las tablas `zonas`, `salas` y `recintos`

**Causa:** Inconsistencia en los tipos de datos de las columnas de ID entre las tablas relacionadas.

## Análisis del Problema

### Estructura Esperada (Según Esquema)
- `zonas.sala_id` → `UUID` (referencia a `salas.id`)
- `salas.id` → `UUID` (clave primaria)
- `salas.recinto_id` → `UUID` (referencia a `recintos.id`)
- `recintos.id` → `UUID` (clave primaria)

### Problema Real
Una o más de estas columnas tienen tipos de datos diferentes a los esperados, causando que PostgreSQL no pueda hacer la comparación en los JOINs.

## Soluciones Implementadas

### 1. Script de Diagnóstico (`diagnose_column_types.sql`)
- Verifica los tipos de datos actuales de todas las columnas relevantes
- Identifica inconsistencias en los tipos de datos
- Muestra ejemplos de datos problemáticos

### 2. Script de Corrección Estructural (`fix_column_types.sql`)
- Corrige los tipos de datos de las columnas problemáticas
- Convierte columnas a UUID cuando es posible
- Recrea foreign keys si es necesario
- **⚠️ ADVERTENCIA:** Puede requerir recrear tablas si las columnas ID son claves primarias

### 3. Script de Corrección de Consulta (`fix_query_with_cast.sql`)
- Corrige las consultas problemáticas usando CAST explícito
- No modifica la estructura de la base de datos
- Proporciona múltiples alternativas de JOIN

### 4. Corrección del Archivo Original (`fix_existing_zonas_tenant.sql`)
- Se corrigió la consulta problemática usando `::text` para ambos lados del JOIN
- Mantiene la funcionalidad original sin cambios estructurales

## Recomendación de Uso

### Para Desarrollo/Testing
1. Ejecutar `diagnose_column_types.sql` para identificar el problema exacto
2. Usar `fix_query_with_cast.sql` para corregir consultas específicas
3. Verificar que las consultas funcionen correctamente

### Para Producción
1. **OPCIÓN SEGURA:** Usar `fix_query_with_cast.sql` (solo corrige consultas)
2. **OPCIÓN COMPLETA:** Usar `fix_column_types.sql` (corrige estructura, pero requiere más cuidado)

## Consultas Corregidas

### Antes (Problemático)
```sql
LEFT JOIN salas s ON z.sala_id = s.id
LEFT JOIN recintos r ON s.recinto_id = r.id
```

### Después (Corregido)
```sql
LEFT JOIN salas s ON z.sala_id::text = s.id::text
LEFT JOIN recintos r ON s.recinto_id::text = r.id::text
```

## Verificación

Después de aplicar cualquier solución, ejecutar:

```sql
-- Verificar que la consulta original funcione
SELECT 
  z.id,
  z.nombre,
  z.sala_id,
  s.nombre as nombre_sala,
  r.nombre as nombre_recinto,
  r.tenant_id as tenant_del_recinto
FROM zonas z
LEFT JOIN salas s ON z.sala_id::text = s.id::text
LEFT JOIN recintos r ON s.recinto_id::text = r.id::text
WHERE z.tenant_id IS NULL
ORDER BY z.id;
```

## Archivos Relacionados

- `diagnose_column_types.sql` - Diagnóstico del problema
- `fix_column_types.sql` - Corrección estructural
- `fix_query_with_cast.sql` - Corrección de consultas
- `fix_existing_zonas_tenant.sql` - Archivo original corregido

## Notas Importantes

1. **Backup:** Siempre hacer backup de la base de datos antes de aplicar cambios estructurales
2. **Testing:** Probar las soluciones en un entorno de desarrollo primero
3. **Monitoreo:** Verificar que las consultas funcionen correctamente después de los cambios
4. **Consistencia:** Asegurar que todos los JOINs similares en el código usen la misma estrategia
