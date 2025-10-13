# Plan de finalización para la plataforma de ticketing

Este plan prioriza los trabajos pendientes para llevar la plataforma de ticketing a un estado listo para producción. Se organiza en cinco frentes principales con tareas accionables, dependencias y entregables esperados.

## 1. Gobernanza multi-tenant y detección de dominio (Prioridad: Alta)
- **Consolidar la detección dinámica de tenants**: revisar el flujo de `TenantContext` para cubrir todas las rutas (localhost, dominio principal, subdominios de Vercel y dominios personalizados) y eliminar dependencias en IDs codificados, sustituyendo los fallbacks por consultas reales o bandejas de error controladas.【F:src/contexts/TenantContext.js†L1-L143】【F:src/contexts/TenantContext.js†L200-L282】
- **Unificar la configuración estática y dinámica**: exponer en un servicio la combinación entre `domainConfig` estático y `getDynamicDomainConfig` de Supabase para evitar duplicar objetos de configuración y mantener consistencia de temas/flags.【F:src/config/domainConfig.js†L1-L123】【F:src/config/domainConfig.js†L136-L207】
- **Persistir y compartir el tenant activo**: completar la propagación del tenant hacia `window.__TENANT_CONTEXT__` y `localStorage` asegurando limpieza y recarga segura en SSR/CSR, añadiendo pruebas manuales para cambio de dominio sin recargar sesión.【F:src/contexts/TenantContext.js†L283-L356】
- **Checklist de salida**: documentación de dominios soportados, pruebas cruzadas en entornos (localhost, staging, producción) y métricas de error en consola.

## 2. Editor de mapas y creación de recintos (Prioridad: Alta)
- **Implementar herramientas faltantes del editor**: completar acciones de la barra (`add-sillas`, `add-texto`, `add-area`) y operaciones avanzadas como escalado masivo, cambio de estado y conexiones manuales para mesas y sillas.【F:src/components/CrearMapa/CrearMapaEditor.jsx†L1047-L1070】【F:src/components/CrearMapa/CrearMapaEditor.jsx†L1610-L1636】
- **Gestión de secciones y zonas**: activar `crearSeccion` y propagación de zonas a nivel de mapa para soportar precios y reportes; definir modelo de datos y sincronización con Supabase.
- **Revisar integración con el backoffice**: asegurar que los mapas creados/actualizados se reflejan en los módulos de recintos y eventos del backoffice, con pruebas de regresión en la UI de administración.
- **Checklist de salida**: manual funcional del editor, guardar/cargar mapas con datos reales y validación de compatibilidad con el selector del store.

## 3. Flujo de selección y bloqueo de asientos en el store (Prioridad: Alta)
- **Mejorar la visualización de `SelectSeats`**: añadir soporte para más tipos de elementos del mapa (zonas, gradas, filas), zoom responsivo y overlays de estado usando los datos de `mapa.contenido` en vez de limitarse a mesas circulares.【F:src/store/pages/SelectSeats.js†L1-L120】【F:src/store/pages/SelectSeats.js†L121-L205】
- **Sincronizar bloqueos entre carrito y Supabase**: reforzar `cartStore` y `seatLockStore` para manejar expiraciones, restauraciones y validaciones de sesión evitando bloqueos huérfanos, reutilizando helpers como `cleanupSessionLocks` y `restoreSessionLocks` con métricas de éxito.【F:src/store/cartStore.js†L1-L160】【F:src/components/seatLockStore.js†L1-L148】
- **Pruebas de concurrencia**: definir escenarios (2 usuarios seleccionando el mismo asiento, expiración de tiempo, reconexión) y registrar resultados para ajustar `toggleSeat`, `lockSeat` y `unlockSeat`.
- **Checklist de salida**: guía de QA con pasos de selección, pago y liberación; monitoreo de tabla `seat_locks` para validar integridad.

## 4. Pasarelas de pago y conciliación (Prioridad: Alta)
- **Auditar fuente única de métodos de pago**: alinear `paymentGatewaysService` para usar consistentemente las tablas (`payment_methods` vs `payment_gateways`) y normalizar los esquemas `config`/`fee_structure` antes de exponerlos al front.【F:src/store/services/paymentGatewaysService.js†L1-L120】
- **Calcular comisiones y totales en un solo punto**: centralizar `calculatePriceWithFees` con caching de tasas y validaciones de moneda, evitando discrepancias entre checkout, receipt y reportes.【F:src/store/services/paymentGatewaysService.js†L63-L104】
- **Integrar callbacks/notificaciones**: revisar `paymentNotifications` y `paymentWebhooks` (si aplica) para asegurar actualización de estados (`pending`, `reservado`, `paid`) y reconciliación con el bloqueo de asientos.
- **Checklist de salida**: pruebas end-to-end con al menos dos pasarelas (tarjeta y transferencia), validación de comisiones y emisión de recibos.

## 5. Post-compra, entrega de tickets y analítica (Prioridad: Media)
- **Optimizar la página de éxito**: completar la carga de datos en `PaymentSuccess`, manejo de reservas pendientes y descarga de tickets (PDF/Wallet), incluyendo reintentos y mensajes claros.【F:src/store/pages/PaymentSuccess.js†L1-L120】【F:src/store/pages/PaymentSuccess.js†L121-L240】
- **Integrar analítica multicanal**: asegurar inicialización de Meta Pixel/otros trackers desde configuraciones del tenant y disparar eventos consistentes en confirmación y abandono.【F:src/store/pages/PaymentSuccess.js†L1-L60】【F:src/store/StoreApp.jsx†L1-L120】
- **Automatizar comunicación post-venta**: validar envío de emails/SMS con localizador y enlaces de descarga tras confirmación, alineado con el estado real de Supabase.
- **Checklist de salida**: pruebas de descarga masiva, verificación de correos, dashboard de métricas operativas en el backoffice.

---

**Siguiente paso recomendado:** priorizar frentes 1–3 de manera paralela (equipos diferentes) y dejar frentes 4–5 como hardening previo al lanzamiento público. Documentar decisiones arquitectónicas en un README del proyecto para mantener el conocimiento centralizado.
