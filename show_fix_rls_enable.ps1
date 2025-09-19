Write-Host "=== HABILITAR RLS EN PAYMENT_TRANSACTIONS ===" -ForegroundColor Green
Write-Host ""
Write-Host "PROBLEMA: RLS deshabilitado pero politicas activas" -ForegroundColor Red
Write-Host ""
Write-Host "CAUSA: Conflicto entre RLS deshabilitado y politicas existentes" -ForegroundColor Yellow
Write-Host ""
Write-Host "SOLUCION: Habilitar RLS y consolidar politicas" -ForegroundColor Green
Write-Host ""
Get-Content "fix_payment_transactions_rls_enable.sql" | Write-Host
Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Yellow
Write-Host "1. Copia el SQL de arriba"
Write-Host "2. Ve a Supabase SQL Editor"
Write-Host "3. Pega y ejecuta TODO el script"
Write-Host "4. Verifica que RLS esta habilitado"
Write-Host "5. Verifica que solo hay 5 politicas (no 6)"
Write-Host "6. Prueba la consulta GET nuevamente"
Write-Host ""
Write-Host "NOTA: Esto deberia resolver el error 406" -ForegroundColor Cyan
