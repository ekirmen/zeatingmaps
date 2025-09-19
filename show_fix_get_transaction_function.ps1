Write-Host "=== CORREGIR FUNCIÓN get_transaction_with_seats ===" -ForegroundColor Green
Write-Host ""
Get-Content "fix_get_transaction_with_seats_function.sql" | Write-Host
Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Yellow
Write-Host "1. Copia el contenido SQL de arriba"
Write-Host "2. Ve a Supabase SQL Editor"
Write-Host "3. Pega y ejecuta el script"
Write-Host "4. Verifica que la función se creó correctamente"
