# 🔒 Guía de Seguridad para Scripts SQL

## ⚠️ **Riesgos de Seguridad**

### **Información sensible que NO debe subirse a GitHub:**
- IDs específicos de funciones, eventos, salas
- Datos de prueba con información real
- Estructura completa de la base de datos
- Credenciales o conexiones
- Datos de clientes/usuarios
- Configuraciones específicas de producción

### **Consecuencias de exponer datos sensibles:**
- **Vulnerabilidades de seguridad** - Ataques SQL injection
- **Exposición de datos personales** - Violación de privacidad
- **Información comercial** - Competencia puede ver tu estructura
- **Configuraciones internas** - Información de infraestructura

## 🛡️ **Reglas de Seguridad**

### **1. Archivos que NUNCA deben subirse:**
```bash
# Scripts con datos específicos
sql/fix_*.sql
sql/insert_*.sql
sql/update_*.sql
sql/delete_*.sql
sql/diagnose_*.sql
sql/check_*.sql
sql/verify_*.sql

# Archivos con IDs específicos
sql/*_functions_*.sql
sql/*_sala_*.sql
sql/*_evento_*.sql

# Archivos de configuración
*config*.js
*secret*.js
*password*.js
```

### **2. Archivos SÍ pueden subirse:**
```bash
# Ejemplos genéricos
sql/clean_example.sql
sql/structure_example.sql
sql/schema_example.sql

# Documentación
docs/SQL_SECURITY_GUIDE.md
docs/DATABASE_STRUCTURE.md
```

## 📝 **Cómo crear scripts seguros**

### **❌ Script PELIGROSO (NO subir):**
```sql
-- PELIGROSO: Contiene IDs específicos
INSERT INTO funciones (id, evento, sala, fecha_celebracion) 
VALUES (10, '5985277e-df15-45ec-bab7-751063f5251c', 7, '2025-07-17');

-- PELIGROSO: Contiene datos reales
SELECT * FROM eventos WHERE id = '5985277e-df15-45ec-bab7-751063f5251c';
```

### **✅ Script SEGURO (SÍ subir):**
```sql
-- SEGURO: Usa placeholders
INSERT INTO funciones (id, evento, sala, fecha_celebracion) 
VALUES ({FUNCION_ID}, '{EVENTO_UUID}', {SALA_ID}, '{FECHA}');

-- SEGURO: Query genérico
SELECT * FROM eventos WHERE id = '{EVENTO_ID}';
```

## 🔧 **Plantillas seguras**

### **Plantilla para diagnóstico:**
```sql
-- Diagnóstico genérico (seguro para GitHub)
SELECT '=== FUNCIONES ===' as seccion;
SELECT 
    id,
    fecha_celebracion,
    evento,
    sala,
    plantilla
FROM funciones 
WHERE id IN (SELECT id FROM funciones LIMIT 2) -- Solo ejemplos
ORDER BY id;
```

### **Plantilla para corrección:**
```sql
-- Corrección genérica (seguro para GitHub)
-- Reemplaza {SALA_ID} con el ID real
INSERT INTO mapas (sala_id, contenido)
SELECT {SALA_ID}, '{ESTRUCTURA_JSON}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM mapas WHERE sala_id = {SALA_ID});
```

## 🚀 **Flujo de trabajo seguro**

### **1. Desarrollo local:**
```bash
# Crear script con datos específicos (solo local)
sql/fix_my_specific_issue.sql

# Ejecutar y probar
psql -d mydb -f sql/fix_my_specific_issue.sql
```

### **2. Documentación para GitHub:**
```bash
# Crear versión genérica
sql/example_fix_template.sql

# Documentar el proceso
docs/HOW_TO_FIX_ISSUE.md
```

### **3. Compartir de forma segura:**
```bash
# Solo subir archivos seguros
git add sql/example_fix_template.sql
git add docs/HOW_TO_FIX_ISSUE.md
git commit -m "📚 Añadir plantilla segura para corrección"
git push
```

## 📋 **Checklist de seguridad**

### **Antes de hacer commit:**
- [ ] ¿El script contiene IDs específicos?
- [ ] ¿El script contiene datos reales?
- [ ] ¿El script expone estructura de BD?
- [ ] ¿El script contiene credenciales?
- [ ] ¿El script es genérico y reutilizable?

### **Si responde SÍ a cualquier pregunta:**
- [ ] Crear versión genérica
- [ ] Usar placeholders
- [ ] Documentar sin exponer datos
- [ ] Verificar que está en .gitignore

## 🛠️ **Herramientas útiles**

### **Convertir script específico a genérico:**
```bash
# Reemplazar IDs específicos
sed 's/10/{FUNCION_ID}/g' script_especifico.sql > script_generico.sql
sed 's/7/{SALA_ID}/g' script_generico.sql > script_final.sql
```

### **Verificar archivos sensibles:**
```bash
# Ver qué archivos están siendo ignorados
git status --ignored

# Ver archivos que se van a subir
git status
```

## 📚 **Ejemplos de documentación segura**

### **Documentar estructura sin exponer datos:**
```markdown
# Estructura de Base de Datos

## Tablas principales:
- `funciones`: Funciones de eventos (id, evento, sala, fecha_celebracion)
- `mapas`: Mapas de asientos (id, sala_id, contenido)
- `zonas`: Zonas de precios (id, nombre, sala_id, aforo)
- `eventos`: Eventos del sistema (id, nombre, slug, descripcion)

## Relaciones:
- `funciones.sala` → `salas.id`
- `mapas.sala_id` → `salas.id`
- `zonas.sala_id` → `salas.id`
```

### **Documentar proceso sin datos específicos:**
```markdown
# Cómo corregir mapas en blanco

## Problema:
Las páginas de mapas muestran contenido en blanco cuando faltan datos.

## Solución:
1. Verificar que existe mapa para la sala
2. Verificar que existen zonas para la sala
3. Crear datos faltantes usando plantillas seguras

## Script de corrección:
Ver `sql/clean_example.sql` para plantilla genérica.
```

## ⚡ **Comandos rápidos**

### **Crear script seguro desde uno específico:**
```bash
# Crear plantilla genérica
cp sql/fix_my_issue.sql sql/example_fix_template.sql

# Reemplazar datos específicos
sed -i 's/10/{FUNCION_ID}/g' sql/example_fix_template.sql
sed -i 's/7/{SALA_ID}/g' sql/example_fix_template.sql
```

### **Verificar seguridad antes de commit:**
```bash
# Ver archivos que se van a subir
git status

# Ver archivos ignorados (sensibles)
git status --ignored

# Ver diferencias
git diff --cached
```

## 🎯 **Resumen**

### **✅ Hacer:**
- Usar placeholders en lugar de IDs específicos
- Crear versiones genéricas de scripts
- Documentar procesos sin exponer datos
- Verificar .gitignore antes de commits

### **❌ NO hacer:**
- Subir scripts con IDs específicos
- Subir scripts con datos reales
- Subir configuraciones de producción
- Subir credenciales o conexiones

---

**Recuerda: La seguridad es responsabilidad de todos. Cuando dudes, pregunta antes de subir.** 