Write-Host "=== AGREGAR COLUMNAS FALTANTES A PAYMENT_TRANSACTIONS ===" -ForegroundColor Green
Write-Host ""
Write-Host "PROBLEMA: La tabla payment_transactions no tiene todas las columnas necesarias" -ForegroundColor Red
Write-Host ""
Write-Host "SOLUCIÓN: Agregar las columnas faltantes" -ForegroundColor Yellow
Write-Host ""
Get-Content "add_missing_payment_transactions_columns.sql" | Write-Host
Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Yellow
Write-Host "1. Copia el SQL de arriba"
Write-Host "2. Ve a Supabase SQL Editor"
Write-Host "3. Pega y ejecuta"
Write-Host "4. Verifica que las columnas se agregaron correctamente"
