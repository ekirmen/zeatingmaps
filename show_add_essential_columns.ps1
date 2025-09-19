Write-Host "=== AGREGAR COLUMNAS ESENCIALES FALTANTES ===" -ForegroundColor Green
Write-Host ""
Write-Host "PROBLEMA: El frontend intenta usar columnas que no existen" -ForegroundColor Red
Write-Host ""
Write-Host "SOLUCION: Agregar las columnas faltantes" -ForegroundColor Yellow
Write-Host ""
Get-Content "add_essential_payment_columns.sql" | Write-Host
Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Yellow
Write-Host "1. Copia el SQL de arriba"
Write-Host "2. Ve a Supabase SQL Editor"
Write-Host "3. Pega y ejecuta"
Write-Host "4. Verifica que las columnas se agregaron"
