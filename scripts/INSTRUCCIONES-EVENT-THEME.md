# 🎨 Configuración de Colores por Evento

## 📋 **Paso a Paso para Implementar**

### **1. Ejecutar el SQL de la base de datos**
```bash
# Conectar a tu base de datos Supabase
psql "postgresql://postgres:[TU_PASSWORD]@db.[TU_PROJECT_REF].supabase.co:5432/postgres"

# Ejecutar el script simplificado (recomendado)
\i scripts/create-event-theme-settings-simple.sql

# O si prefieres el script completo (puede tener problemas de tipos)
\i scripts/create-event-theme-settings.sql
```

### **2. Verificar que la tabla se creó correctamente**
```sql
-- Verificar la estructura de la tabla
\d event_theme_settings

-- Verificar las políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'event_theme_settings';
```

### **3. Probar la funcionalidad**
1. **Ve a** `/dashboard/webcolors`
2. **Haz clic en** "Colores por Evento"
3. **Selecciona un evento** marcando el checkbox
4. **Haz clic en** "Crear Tema"
5. **Configura los colores** para ese evento específico
6. **Guarda** la configuración

### **4. Verificar en los mapas**
1. **Abre el mapa del evento** en la tienda
2. **Verifica que los colores** sean los específicos del evento
3. **Abre otro evento** y verifica que use los colores globales

## 🔧 **Funcionalidades Implementadas**

### **✅ Panel de Colores por Evento**
- Lista todos los eventos del tenant
- Muestra eventos con tema personalizado vs. global
- Permite crear, editar y eliminar temas por evento
- Botón para restablecer a tema global

### **✅ Colores Separados**
- **Vendido**: Color específico para asientos vendidos
- **Reservado**: Color específico para asientos reservados
- **Disponible**: Color para asientos disponibles
- **Seleccionado por mí**: Color para asientos del usuario actual
- **Seleccionado por otro**: Color para asientos de otros usuarios
- **Bloqueado**: Color para asientos bloqueados

### **✅ Integración Automática**
- Los mapas detectan automáticamente si hay tema específico del evento
- Fallback a colores globales si no hay tema específico
- Sincronización en tiempo real entre Boletería y Store

## 🎯 **Casos de Uso**

### **🎭 Eventos de Teatro**
- Colores más suaves y elegantes
- Verde oscuro para disponibles
- Dorado para seleccionados

### **🎪 Eventos de Música**
- Colores vibrantes y energéticos
- Azul eléctrico para disponibles
- Naranja para seleccionados

### **🏟️ Eventos Deportivos**
- Colores del equipo local
- Verde del equipo para disponibles
- Rojo para seleccionados

## 🚨 **Solución de Problemas**

### **❌ Error: "operator does not exist: uuid = text"**
```sql
-- Este error ocurre por problemas de tipos en las políticas RLS
-- Solución: Usar el script simplificado
\i scripts/create-event-theme-settings-simple.sql

-- O corregir manualmente las políticas:
DROP POLICY IF EXISTS "Users can view own tenant event theme settings" ON public.event_theme_settings;
CREATE POLICY "Enable all operations for authenticated users" ON public.event_theme_settings
  FOR ALL USING (auth.role() = 'authenticated');
```

### **❌ Error: "relation does not exist"**
```sql
-- Verificar que la tabla existe
SELECT * FROM information_schema.tables 
WHERE table_name = 'event_theme_settings';
```

### **❌ Error: "permission denied"**
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies 
WHERE tablename = 'event_theme_settings';
```

### **❌ Los colores no se aplican**
1. Verificar que el `funcionId` se pasa correctamente
2. Revisar la consola del navegador para errores
3. Verificar que el evento tiene tema configurado

## 📱 **Uso en el Frontend**

### **Hook useSeatColors**
```javascript
// Usar colores globales
const { getSeatColor } = useSeatColors();

// Usar colores específicos del evento
const { getSeatColor } = useSeatColors('event-id-123');
```

### **Hook useEventTheme**
```javascript
const { theme, loading, isEventSpecific } = useEventTheme('event-id-123');

if (loading) return <div>Cargando tema...</div>;
if (isEventSpecific) console.log('Usando tema personalizado del evento');
```

## 🎨 **Ejemplo de Configuración**

```javascript
// Tema para evento de teatro
{
  seat_available: '#2d5016',      // Verde oscuro elegante
  seat_selected_me: '#d4af37',    // Dorado
  seat_selected_other: '#b8860b', // Dorado oscuro
  seat_blocked: '#8b0000',        // Rojo oscuro
  seat_sold: '#696969',           // Gris elegante
  seat_reserved: '#4b0082'        // Púrpura oscuro
}
```

## 🔄 **Próximos Pasos Opcionales**

1. **Previsualización en tiempo real** de los colores
2. **Templates predefinidos** para tipos de eventos
3. **Importar/Exportar** configuraciones de colores
4. **Historial de cambios** en los temas
5. **Colores por zona** dentro del mismo evento
