Write-Host "=== VERIFICAR PROBLEMAS DE AUTENTICACIÓN ===" -ForegroundColor Green
Write-Host ""
Write-Host "PROBLEMA: Error 'No API key found in request'" -ForegroundColor Red
Write-Host ""
Write-Host "CAUSA: Cliente de Supabase no autenticado correctamente" -ForegroundColor Yellow
Write-Host ""
Write-Host "SOLUCION: Verificar autenticación y configuración" -ForegroundColor Green
Write-Host ""
Get-Content "fix_supabase_auth_issue.sql" | Write-Host
Write-Host ""
Write-Host "=== INSTRUCCIONES ===" -ForegroundColor Yellow
Write-Host "1. Copia el SQL de arriba"
Write-Host "2. Ve a Supabase SQL Editor"
Write-Host "3. Pega y ejecuta TODO el script"
Write-Host "4. Verifica que el usuario está autenticado"
Write-Host "5. Verifica que las funciones RLS funcionan"
Write-Host "6. Verifica que puede acceder a payment_transactions"
Write-Host ""
Write-Host "NOTA: También corregí el import en paymentGatewaysService.js" -ForegroundColor Cyan
