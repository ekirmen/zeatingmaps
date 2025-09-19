Write-Host "=== VERIFICAR TODAS LAS COLUMNAS DE PAYMENT_TRANSACTIONS ===" -ForegroundColor Green
Write-Host ""
Get-Content "check_all_payment_transactions_columns.sql" | Write-Host
Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Yellow
Write-Host "1. Copia el SQL de arriba"
Write-Host "2. Ve a Supabase SQL Editor"
Write-Host "3. Pega y ejecuta"
Write-Host "4. Revisa TODAS las columnas de la tabla"
