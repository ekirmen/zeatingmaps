
## 🚀 **Versión AÚN MÁS SIMPLE** (si solo quieres reemplazar imports):

```powershell
# Script SIMPLIFICADO - solo reemplaza imports
cd C:\zeatingmaps

# 1. Buscar archivos con imports de moment
$files = Get-ChildItem -Path "src" -Recurse -Include "*.js", "*.jsx" | 
    Where-Object { (Get-Content $_.FullName) -match "import.*moment" }

# 2. Mostrar qué se encontró
Write-Host "Archivos con moment:" -ForegroundColor Yellow
$files | ForEach-Object { Write-Host "  $($_.FullName)" }

# 3. Preguntar confirmación
$confirm = Read-Host "`n¿Reemplazar imports? (S/N)"
if ($confirm -notmatch "^[Ss]") { exit }

# 4. Reemplazar
foreach ($file in $files) {
    (Get-Content $file.FullName) -replace 
        "import moment from 'moment'", 
        "import { format, parseISO, fromUnixTime } from 'date-fns'" |
    Set-Content $file.FullName
    Write-Host "✓ $($file.Name)" -ForegroundColor Green
}

Write-Host "`nListo! Ahora ejecuta:" -ForegroundColor Cyan
Write-Host "npm uninstall moment" -ForegroundColor Yellow
Write-Host "npm install date-fns" -ForegroundColor Yellow