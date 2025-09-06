# Migraciones para Métodos de Pago

## Orden de Ejecución

Ejecuta estas migraciones en Supabase SQL Editor en el siguiente orden:

### 1. Primero: Configurar Métodos de Pago
```sql
-- Ejecutar: migrations/020_final_payment_methods_setup.sql
```
Esto:
- Agrega la columna `tenant_id` si no existe
- Actualiza registros existentes con el tenant_id correcto
- Crea/actualiza todos los métodos de pago usando UPSERT

### 2. Segundo: Arreglar Estructura de Transacciones
```sql
-- Ejecutar: migrations/021_fix_payment_transactions_structure.sql
```
Esto:
- Verifica y corrige la estructura de la tabla `payment_transactions`
- Asegura que `order_id` sea VARCHAR y `gateway_id` sea UUID
- Crea la tabla si no existe
- Habilita RLS y crea políticas

### 3. Tercero: Verificar Configuración
```sql
-- Ejecutar: migrations/017_verify_payment_methods.sql
```
Esto verifica que todo esté configurado correctamente.

## Resultado Esperado

Después de ejecutar las migraciones:
- ✅ Tabla `payment_methods_global` con columna `tenant_id`
- ✅ 8 métodos de pago creados para el tenant
- ✅ Todos los métodos habilitados por defecto
- ✅ Configuraciones básicas establecidas

## Verificación

Después de las migraciones, recarga:
- `https://sistema.veneventos.com/store/payment`

Deberías ver los métodos de pago disponibles sin errores.
