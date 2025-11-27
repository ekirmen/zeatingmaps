# Plan de pruebas de concurrencia

## Escenarios básicos
- **Selección simultánea**: dos clientes eligen el mismo asiento en paralelo para validar que solo el primer bloqueo es aceptado y el segundo recibe error visual.
- **Expiración de sesión**: mantener un asiento bloqueado hasta que el temporizador del carrito expire y comprobar que el backend libera el bloqueo y la UI limpia el carrito.
- **Reconexión tras desconexión**: simular desconexión de red, restaurar la conexión y verificar que `restoreCurrentSession` reactiva los bloqueos del usuario.

## Pasos sugeridos
1. Abrir dos navegadores con `anonSessionId` distintos y observar el color de overlays cuando se disputa un asiento.
2. Forzar expiración ajustando `cart_lock_minutes` en `localStorage` a un valor bajo y esperar limpieza automática.
3. Desconectar la red (modo offline del navegador), seleccionar un asiento, reconectar y validar que la suscripción Realtime vuelve a reflejar los estados.
