# Servicio de Tiempo Real (RealtimeService)

## Descripción

El `RealtimeService` es un servicio que proporciona sincronización en tiempo real para los mapas de asientos. Utiliza un sistema de polling para verificar actualizaciones y mantener sincronizados múltiples clientes.

## Características

- ✅ **Suscripciones por sala**: Cada sala tiene su propia suscripción independiente
- ✅ **Polling inteligente**: Verifica actualizaciones cada 2 segundos
- ✅ **Manejo de errores robusto**: Detecta y maneja fallos de API automáticamente
- ✅ **Reintentos automáticos**: Intenta reconectar después de fallos
- ✅ **Estado de salud**: Monitorea la disponibilidad de la API
- ✅ **Limpieza automática**: Limpia recursos al cerrar la página

## Uso Básico

### 1. Suscribirse a una sala

```javascript
import realtimeService from './services/realtimeService';

// Suscribirse a cambios en una sala
await realtimeService.subscribeToSala('sala-123', (data) => {
  console.log('Actualización recibida:', data);
  // Aquí puedes actualizar tu UI
});
```

### 2. Desuscribirse de una sala

```javascript
// Desuscribirse cuando ya no necesites las actualizaciones
realtimeService.unsubscribeFromSala('sala-123');
```

### 3. Verificar estado del servicio

```javascript
// Obtener estado de todas las suscripciones
const status = realtimeService.getSubscriptionStatus();
console.log('Estado del servicio:', status);
```

### 4. Verificar salud de la API

```javascript
// Verificar si la API está funcionando
const isHealthy = await realtimeService.checkApiHealth();
console.log('API saludable:', isHealthy);
```

## API Endpoints

### POST /api/realtime-sync

**Parámetros:**
- `salaId`: ID de la sala
- `action`: Acción a realizar (`get_updates` o `notify_change`)
- `data`: Datos adicionales (opcional)

**Acciones disponibles:**

#### get_updates
Obtiene las últimas actualizaciones para una sala específica.

```javascript
const response = await fetch('/api/realtime-sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    salaId: 'sala-123',
    action: 'get_updates'
  })
});
```

#### notify_change
Notifica un cambio a otros clientes.

```javascript
const response = await fetch('/api/realtime-sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    salaId: 'sala-123',
    action: 'notify_change',
    data: { type: 'seat_update', seatId: 'seat-456' }
  })
});
```

## Solución de Problemas

### Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

**Causa:** El endpoint `/api/realtime-sync` no existe o no está configurado correctamente.

**Solución:**
1. Verifica que el archivo `api/realtime-sync.js` existe
2. Asegúrate de que tu servidor esté configurado para manejar rutas API
3. Verifica que no haya conflictos de rutas

### Error: "Service role key no encontrada"

**Causa:** La variable de entorno `SUPABASE_SERVICE_ROLE_KEY` no está configurada.

**Solución:**
1. Agrega la clave de servicio a tu archivo `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=tu_clave_aqui
   ```
2. Reinicia tu servidor de desarrollo

### El servicio no se conecta

**Solución:**
1. Verifica la salud de la API:
   ```javascript
   await realtimeService.checkApiHealth();
   ```

2. Reactiva manualmente la API:
   ```javascript
   realtimeService.reactivateApi();
   ```

3. Verifica el estado del servicio:
   ```javascript
   console.log(realtimeService.getSubscriptionStatus());
   ```

## Pruebas

Usa el archivo `test_realtime_service.js` para probar el servicio:

1. Abre la consola del navegador en la página de crear mapa
2. Copia y pega el contenido del archivo de prueba
3. Las pruebas se ejecutarán automáticamente
4. Revisa los logs para identificar problemas

## Configuración Avanzada

### Cambiar intervalo de polling

```javascript
// En realtimeService.js, línea ~70
const interval = setInterval(async () => {
  await this.checkForUpdates(salaId);
}, 5000); // Cambiar a 5 segundos
```

### Agregar más acciones personalizadas

1. Agrega el caso en `api/realtime-sync.js`:
   ```javascript
   case 'custom_action':
     // Tu lógica personalizada aquí
     break;
   ```

2. Llama desde el frontend:
   ```javascript
   const response = await fetch('/api/realtime-sync', {
     method: 'POST',
     body: JSON.stringify({
       salaId: 'sala-123',
       action: 'custom_action'
     })
   });
   ```

## Monitoreo

El servicio registra información detallada en la consola:

- `[RealtimeService]` - Operaciones del servicio
- `[API]` - Operaciones del endpoint API
- `[loadMapa]` - Operaciones de carga de mapas

## Limitaciones

- **Polling**: No es tan eficiente como WebSockets para actualizaciones muy frecuentes
- **Escalabilidad**: El polling puede ser costoso con muchas salas activas
- **Latencia**: Hay un retraso de hasta 2 segundos para detectar cambios

## Futuras Mejoras

- [ ] Implementar WebSockets para actualizaciones en tiempo real
- [ ] Agregar compresión de datos
- [ ] Implementar cache local para reducir peticiones
- [ ] Agregar métricas de rendimiento
- [ ] Implementar reconexión automática más inteligente
