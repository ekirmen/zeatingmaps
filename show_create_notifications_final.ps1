Write-Host "=== CREAR TABLA NOTIFICATIONS ===" -ForegroundColor Green
Write-Host ""
Get-Content "create_notifications_table_final.sql" | Write-Host
Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Yellow
Write-Host "1. Copia el contenido SQL de arriba"
Write-Host "2. Ve a Supabase SQL Editor"
Write-Host "3. Pega y ejecuta el script"
Write-Host "4. Verifica que la tabla se creó correctamente"
