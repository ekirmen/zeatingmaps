Write-Host "=== CORREGIR RLS POLICIES PARA PAYMENT_TRANSACTIONS ===" -ForegroundColor Green
Write-Host ""
Write-Host "PROBLEMA: Políticas RLS duplicadas causan errores 400/406" -ForegroundColor Red
Write-Host ""
Get-Content "fix_payment_transactions_rls.sql" | Write-Host
Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Yellow
Write-Host "1. Copia el SQL de arriba"
Write-Host "2. Ve a Supabase SQL Editor"
Write-Host "3. Pega y ejecuta"
Write-Host "4. Prueba el pago nuevamente"
