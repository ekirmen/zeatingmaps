Write-Host "=== CORREGIR RLS POLICIES PARA PAYMENT_TRANSACTIONS ===" -ForegroundColor Green
Write-Host ""
Write-Host "PROBLEMA IDENTIFICADO:" -ForegroundColor Red
Write-Host "- Múltiples políticas SELECT duplicadas"
Write-Host "- Política tenant_admin con rol PUBLIC (incorrecto)"
Write-Host "- Políticas duplicadas causan errores 400/406"
Write-Host ""
Write-Host "SOLUCIÓN:" -ForegroundColor Yellow
Write-Host "- Eliminar todas las políticas existentes"
Write-Host "- Crear políticas consolidadas y optimizadas"
Write-Host "- Corregir roles y permisos"
Write-Host ""
Get-Content "fix_payment_transactions_rls.sql" | Write-Host
Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Yellow
Write-Host "1. Copia el contenido SQL de arriba"
Write-Host "2. Ve a Supabase SQL Editor"
Write-Host "3. Pega y ejecuta el script"
Write-Host "4. Verifica que las políticas se crearon correctamente"
Write-Host "5. Prueba el flujo de pago nuevamente"
