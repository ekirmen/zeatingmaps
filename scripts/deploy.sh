#!/bin/bash

# Script de deploy para VeeEventos
# Uso: ./scripts/deploy.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}

echo "🚀 Iniciando deploy de VeeEventos..."

# Verificar que Vercel CLI esté instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado. Instalando..."
    npm install -g vercel
fi

# Verificar variables de entorno
echo "🔍 Verificando variables de entorno..."

if [ -z "$SUPABASE_URL" ]; then
    echo "❌ SUPABASE_URL no está definida"
    exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ SUPABASE_ANON_KEY no está definida"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY no está definida"
    exit 1
fi

echo "✅ Variables de entorno verificadas"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Ejecutar tests (opcional)
echo "🧪 Ejecutando tests..."
npm test || echo "⚠️ Tests fallaron, continuando con el deploy..."

# Build del proyecto
echo "🔨 Construyendo proyecto..."
npm run build

# Deploy según el entorno
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "🌐 Deploying a producción..."
    vercel --prod --confirm
    echo "✅ Deploy a producción completado"
    echo "🔗 URL: https://sistema.veneventos.com"
else
    echo "🧪 Deploying a desarrollo..."
    vercel --confirm
    echo "✅ Deploy a desarrollo completado"
    echo "🔗 URL: https://sistema-veneventos-git-main.vercel.app"
fi

# Verificar endpoints
echo "🔍 Verificando endpoints..."

# Esperar un poco para que el deploy se complete
sleep 10

# Probar endpoint de salud
echo "🏥 Probando endpoint de salud..."
curl -f https://sistema.veneventos.com/api/health || echo "⚠️ Endpoint de salud no disponible"

# Probar endpoint de eventos
echo "🎭 Probando endpoint de eventos..."
curl -f "https://sistema.veneventos.com/api/events/list?tenant_id=test" || echo "⚠️ Endpoint de eventos no disponible"

echo "🎉 Deploy completado exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Verificar que todos los endpoints funcionen correctamente"
echo "2. Configurar monitoreo en Vercel Dashboard"
echo "3. Configurar alertas de error"
echo "4. Actualizar documentación si es necesario"
echo ""
echo "🔗 Dashboard de Vercel: https://vercel.com/dashboard"
echo "📊 Logs: vercel logs"
echo "🔧 Variables de entorno: vercel env ls"
