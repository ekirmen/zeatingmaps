@echo off
REM Script de deploy para VeeEventos en Windows
REM Uso: scripts\deploy.bat [dev|prod]

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=dev

echo 🚀 Iniciando deploy de VeeEventos...

REM Verificar que Vercel CLI esté instalado
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Vercel CLI no está instalado. Instalando...
    npm install -g vercel
)

REM Verificar variables de entorno
echo 🔍 Verificando variables de entorno...

if "%SUPABASE_URL%"=="" (
    echo ❌ SUPABASE_URL no está definida
    exit /b 1
)

if "%SUPABASE_ANON_KEY%"=="" (
    echo ❌ SUPABASE_ANON_KEY no está definida
    exit /b 1
)

if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ❌ SUPABASE_SERVICE_ROLE_KEY no está definida
    exit /b 1
)

echo ✅ Variables de entorno verificadas

REM Instalar dependencias
echo 📦 Instalando dependencias...
npm install

REM Build del proyecto
echo 🔨 Construyendo proyecto...
npm run build

REM Deploy según el entorno
if "%ENVIRONMENT%"=="prod" (
    echo 🌐 Deploying a producción...
    vercel --prod --confirm
    echo ✅ Deploy a producción completado
    echo 🔗 URL: https://sistema.veneventos.com
) else (
    echo 🧪 Deploying a desarrollo...
    vercel --confirm
    echo ✅ Deploy a desarrollo completado
    echo 🔗 URL: https://sistema-veneventos-git-main.vercel.app
)

echo 🎉 Deploy completado exitosamente!
echo.
echo 📋 Próximos pasos:
echo 1. Verificar que todos los endpoints funcionen correctamente
echo 2. Configurar monitoreo en Vercel Dashboard
echo 3. Configurar alertas de error
echo 4. Actualizar documentación si es necesario
echo.
echo 🔗 Dashboard de Vercel: https://vercel.com/dashboard
echo 📊 Logs: vercel logs
echo 🔧 Variables de entorno: vercel env ls

pause
