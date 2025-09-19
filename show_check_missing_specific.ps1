Write-Host "=== VERIFICAR COLUMNAS ESPECÍFICAS QUE CAUSAN ERRORES ===" -ForegroundColor Green
Write-Host ""
Write-Host "PROBLEMA: El frontend está intentando usar columnas que no existen" -ForegroundColor Red
Write-Host ""
Write-Host "SOLUCIÓN: Verificar exactamente qué columnas faltan" -ForegroundColor Yellow
Write-Host ""
Get-Content "check_missing_columns_specific.sql" | Write-Host
Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Yellow
Write-Host "1. Copia el SQL de arriba"
Write-Host "2. Ve a Supabase SQL Editor"
Write-Host "3. Pega y ejecuta"
Write-Host "4. Verifica que columnas faltan" -ForegroundColor Yellow
