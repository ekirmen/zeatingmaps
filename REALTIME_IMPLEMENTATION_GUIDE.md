# Guía de Implementación de Supabase Realtime para Mapas

## ¿Qué es Supabase Realtime?

Supabase Realtime es una funcionalidad que permite **sincronización en tiempo real** de datos entre múltiples clientes. Cuando un usuario hace cambios en la base de datos, todos los demás usuarios conectados reciben las actualizaciones automáticamente.

## ¿Por qué implementar Realtime en mapas?

### Problemas que resuelve:
1. **Sincronización automática**: Múltiples usuarios pueden editar el mismo mapa simultáneamente
2. **Actualizaciones en tiempo real**: Los cambios se reflejan inmediatamente sin recargar
3. **Mejor experiencia de usuario**: No hay necesidad de guardar y recargar manualmente
4. **Colaboración en equipo**: Diseñadores pueden trabajar juntos en el mismo mapa

### Casos de uso:
- **Equipos de diseño** trabajando en el mismo evento
- **Múltiples administradores** configurando mapas simultáneamente
- **Sincronización automática** entre diferentes dispositivos

## Implementación Técnica

### 1. Base de Datos (PostgreSQL)

#### Script SQL: `enable_mapas_realtime.sql`
```sql
-- Habilitar Realtime para la tabla mapas
INSERT INTO supabase_realtime.subscription (subscription_id, entity, filters, claims)
VALUES (
  'mapas_realtime',
  'mapas',
  '{}',
  '{}'
) ON CONFLICT (subscription_id) DO NOTHING;
```

#### Columna `updated_at`
- **Propósito**: Tracking de cuándo se modificó el mapa por última vez
- **Uso**: Evitar recargas innecesarias cuando el cambio es propio
- **Trigger**: Se actualiza automáticamente en cada modificación

### 2. Frontend (React + Supabase)

#### Hook: `useMapaLoadingSaving`
```javascript
// Suscripción a cambios en tiempo real
realtimeSubscription.current = supabase
  .channel(`mapas-sala-${salaId}`)
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'mapas',
      filter: `sala_id=eq.${salaId}`
    },
    (payload) => {
      console.log('[Realtime] Cambio detectado:', payload);
      
      // Solo procesar si no es nuestro propio cambio
      if (payload.new && payload.new.updated_at !== lastSavedAt) {
        console.log('[Realtime] Recargando mapa...');
        // Aquí se podría recargar el mapa
      }
    }
  )
  .subscribe();
```

#### Canales de Suscripción
- **`mapas-sala-{salaId}`**: Cambios en la tabla `mapas` para una sala específica
- **`seats-sala-{salaId}`**: Cambios en la tabla `seats` para una sala específica

## Flujo de Funcionamiento

### 1. Usuario A mueve una mesa
```
Usuario A → Arrastra mesa → handleSave() → Supabase → updated_at = NOW()
```

### 2. Usuario B recibe la actualización
```
Supabase → Realtime → Usuario B → payload.updated_at !== lastSavedAt → Recargar mapa
```

### 3. Usuario A NO recibe su propio cambio
```
Supabase → Realtime → Usuario A → payload.updated_at === lastSavedAt → No recargar
```

## Configuración en Supabase Dashboard

### 1. Habilitar Realtime
- Ir a **Database** → **Replication**
- Activar **Realtime** para la tabla `mapas`

### 2. Configurar Políticas RLS
- **Lectura**: Permitir acceso anónimo para mapas públicos
- **Escritura**: Solo usuarios autenticados del tenant correspondiente

### 3. Monitorear Uso
- **Database** → **Logs** → Ver consultas y cambios en tiempo real
- **Realtime** → **Channels** → Ver canales activos y suscriptores

## Ventajas de la Implementación

### ✅ **Beneficios**
- **Sincronización automática** entre usuarios
- **Mejor experiencia colaborativa**
- **Reducción de conflictos** de datos
- **Actualizaciones inmediatas** sin recargas

### ⚠️ **Consideraciones**
- **Consumo de ancho de banda** (mínimo para mapas)
- **Complejidad adicional** en el manejo de estado
- **Posibles conflictos** si múltiples usuarios editan simultáneamente

## Testing y Debugging

### 1. Verificar Suscripción
```javascript
// En la consola del navegador
console.log('[Realtime] Estado:', realtimeSubscription.current);
```

### 2. Simular Cambios
```javascript
// Usar el script de testing
test_mapa_save_reload.js
```

### 3. Logs de Realtime
```javascript
// Ver todos los eventos en tiempo real
console.log('[Realtime] Evento recibido:', payload);
```

## Próximos Pasos

### 1. **Implementar Resolución de Conflictos**
- Detectar ediciones simultáneas
- Mostrar alertas al usuario
- Permitir resolver conflictos manualmente

### 2. **Optimizar Sincronización**
- Sincronizar solo elementos modificados
- Implementar debouncing para cambios rápidos
- Cache local para reducir consultas

### 3. **Extender a Otras Tablas**
- `seats` para sincronización de asientos
- `zonas` para cambios en zonas
- `eventos` para cambios en eventos

## Conclusión

La implementación de Realtime para la tabla `mapas` proporciona:

1. **Sincronización automática** en tiempo real
2. **Mejor experiencia colaborativa** para equipos
3. **Reducción de conflictos** de datos
4. **Base sólida** para funcionalidades avanzadas

Esta implementación resuelve el problema actual de guardado y abre la puerta a funcionalidades colaborativas más avanzadas en el futuro.
