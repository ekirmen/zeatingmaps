Write-Host "=== SOLO ARREGLAR RLS PARA PAYMENT_TRANSACTIONS ===" -ForegroundColor Green
Write-Host ""
Write-Host "PROBLEMA: Error 406 (Not Acceptable) al consultar payment_transactions" -ForegroundColor Red
Write-Host ""
Write-Host "CAUSA: Políticas RLS muy restrictivas" -ForegroundColor Yellow
Write-Host ""
Write-Host "SOLUCION: Políticas RLS más permisivas para payment_transactions" -ForegroundColor Green
Write-Host ""
Get-Content "fix_payment_transactions_rls_only.sql" | Write-Host
Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Yellow
Write-Host "1. Copia el SQL de arriba"
Write-Host "2. Ve a Supabase SQL Editor"
Write-Host "3. Pega y ejecuta TODO el script"
Write-Host "4. Verifica que las políticas se crearon correctamente"
Write-Host "5. Prueba la consulta GET payment_transactions nuevamente"
