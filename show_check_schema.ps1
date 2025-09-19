Write-Host "=== VERIFICAR ESTRUCTURA DE PAYMENT_TRANSACTIONS ===" -ForegroundColor Green
Write-Host ""
Get-Content "check_payment_transactions_schema.sql" | Write-Host
Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Yellow
Write-Host "1. Copia el SQL de arriba"
Write-Host "2. Ve a Supabase SQL Editor"
Write-Host "3. Pega y ejecuta"
Write-Host "4. Revisa la estructura de la tabla"
