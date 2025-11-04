# Inventario de Funciones Serverless

## Funciones Críticas (NO DESACTIVAR)

1. **`api/payments/[locator]/[[...action]].js`** ⭐ CRÍTICO
   - Maneja: descarga de tickets, email de tickets, debug, diagnostic
   - Ruta: `/api/payments/[locator]/download`
   - Uso: Descarga de tickets PDF
   - **Estado**: DEBE ESTAR ACTIVO

## Funciones Menos Críticas (Candidatas para Desactivar)

2. **`api/test-email-config.js`** / `pages/api/test-email-config.js`
   - Uso: Solo para testing de configuración de email
   - **Recomendación**: DESACTIVAR (duplicado)
   - Acción: Eliminar o renombrar a `_test-email-config.js` (Vercel ignora archivos que empiezan con `_`)

3. **`pages/api/seat-locks/status.js`** / `api/seat-locks/status.js`
   - Uso: Status de seat locks (ya no se usa mucho, se reemplazó por RPC atómico)
   - **Recomendación**: DESACTIVAR si hay duplicado
   - Acción: Mantener solo uno o eliminar ambos si no se usan

4. **`src/pages/api/test-paypal-connection.js`**
   - Uso: Solo para testing de PayPal
   - **Recomendación**: DESACTIVAR
   - Acción: Eliminar o renombrar a `_test-paypal-connection.js`

5. **`src/pages/api/test-stripe-connection.js`**
   - Uso: Solo para testing de Stripe
   - **Recomendación**: DESACTIVAR
   - Acción: Eliminar o renombrar a `_test-stripe-connection.js`

## Funciones Activas (Mantener)

6. `api/payments/search-by-email.js` - Búsqueda de pagos por email
7. `api/events/list.js` / `pages/api/events/list.js` - Lista de eventos
8. `pages/api/events/get-by-slug.js` - Evento por slug
9. `api/grid-sale/load-zonas.js` / `pages/api/grid-sale/load-zonas.js` - Carga de zonas
10. `pages/api/grid-sale/process-sale.js` - Procesar venta
11. `pages/api/grid-sale/validate-sale.js` - Validar venta
12. `api/mapas/[salaId]/index.js` / `api/mapas/[salaId]/save.js` - Mapas de salas
13. `api/zonas/index.js` - Zonas
14. `api/recintos/[id]/delete.js` - Eliminar recinto
15. `pages/api/saas/dashboard-stats.js` - Estadísticas SaaS
16. `pages/api/saas/user-management.js` - Gestión de usuarios SaaS
17. `pages/api/analytics/sales-report.js` - Reporte de ventas

## Acciones Recomendadas

1. **Eliminar funciones de test** (ahorran ~3-4 funciones):
   - `api/test-email-config.js` → renombrar a `_test-email-config.js`
   - `pages/api/test-email-config.js` → renombrar a `_test-email-config.js`
   - `src/pages/api/test-paypal-connection.js` → eliminar o renombrar
   - `src/pages/api/test-stripe-connection.js` → eliminar o renombrar

2. **Eliminar duplicados** (ahorran ~2-3 funciones):
   - Si `api/seat-locks/status.js` y `pages/api/seat-locks/status.js` hacen lo mismo, eliminar uno
   - Verificar otros duplicados entre `api/` y `pages/api/`

3. **Verificar que `api/payments/[locator]/[[...action]].js` esté activo** en Vercel

## Nota sobre Vercel

En Vercel, puedes desactivar funciones renombrándolas con prefijo `_` o eliminándolas.
Las funciones deben estar en `api/` o `pages/api/` para ser detectadas automáticamente.

