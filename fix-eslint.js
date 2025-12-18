// fix-eslint-issues.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Archivos con problemas críticos a revisar primero
const PRIORITY_FILES = [
    'src/backoffice/components/CrearMapa/SeatingLite.jsx',
    'src/backoffice/components/CrearMapa/CrearMapaEditor.jsx',
    'src/backoffice/hooks/useBoleteria.js',
    'src/backoffice/pages/CrearMapaPage.jsx'
];

// Reglas de corrección
const FIX_RULES = {
    // 1. Eliminar variables no usadas comunes
    removeUnusedImports: (content) => {
        const unusedPatterns = [
            // Componentes de Ant Design no usados
            /import\s*{\s*[^}]*\b(Menu|Tooltip|Badge|Row|Col|Divider|Alert|Spin|Modal|Form|Card|Space|Upload|Progress|Popconfirm|Dropdown|Tabs)\b[^}]*}\s*from\s*['"]antd['"][^;]*;/g,
            // Íconos no usados
            /import\s*{\s*[^}]*\b(ArrowLeftOutlined|EyeOutlined|EyeInvisibleOutlined|SaveOutlined|PlusOutlined|MinusOutlined|CloseOutlined|InfoCircleOutlined|QuestionCircleOutlined|ZoomInOutlined|ZoomOutOutlined|PictureOutlined|SettingOutlined|RedoOutlined|AlignLeftOutlined|AlignCenterOutlined|AlignRightOutlined|VerticalAlignTopOutlined|VerticalAlignMiddleOutlined|VerticalAlignBottomOutlined|FullscreenOutlined|CompressOutlined|DownloadOutlined|SearchOutlined|HomeOutlined|DollarOutlined|PercentageOutlined|LinkOutlined|ShareAltOutlined|TrendingUpOutlined|StarOutlined|FolderOpenOutlined|DeleteOutlined|LockOutlined|UnlockOutlined|CodeOutlined|FilterOutlined|TagsOutlined|CheckCircleOutlined|CheckOutlined|ScissorOutlined|ClearOutlined)\b[^}]*}\s*from\s*['"]@ant-design\/icons['"][^;]*;/g,
            // FontAwesome no usados
            /import\s*{\s*[^}]*\b(faShieldAlt|faTruck|faReceipt|faDatabase)\b[^}]*}\s*from\s*['"][^'"]*['"][^;]*;/g,
        ];

        let fixedContent = content;
        unusedPatterns.forEach(pattern => {
            fixedContent = fixedContent.replace(pattern, '');
        });

        // Eliminar líneas vacías múltiples
        fixedContent = fixedContent.replace(/\n\s*\n\s*\n/g, '\n\n');

        return fixedContent;
    },

    // 2. Agregar dependencias faltantes a useEffect/useCallback
    fixMissingDeps: (content) => {
        // Patrones comunes de dependencias faltantes
        const depPatterns = [
            // Para: useEffect con dependencias vacías pero usa variables
            /useEffect\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[\s*\]\s*\)/g,
            // Para: useCallback con dependencias vacías
            /useCallback\s*\(\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\},\s*\[\s*\]\s*\)/g
        ];

        let fixedContent = content;

        // Este es un ejemplo simple. En un caso real necesitarías análisis más complejo
        // Aquí solo agregamos comentarios para marcar los lugares
        fixedContent = fixedContent.replace(
            /(use(Effect|Callback|Memo))\s*\(\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\},\s*\[\s*\]\s*\)/g,
            (match, hookType) => {
                return `// TODO: Revisar dependencias de ${hookType}\n${match}`;
            }
        );

        return fixedContent;
    },

    // 3. Eliminar variables declaradas pero no usadas
    removeUnusedVariables: (content) => {
        // Variables comunes no usadas encontradas en los logs
        const unusedVars = [
            'isTablet', 'loading', 'data', 'result', 'zonas', 'entradas',
            'saving', 'recentEvents', 'wasActivated', 'mesas', 'currentDesactivado',
            'totalCanales', 'mapaVisible', 'selectedZona', 'selectedButacas',
            'widthParam', 'showSuccess', 'pricesWithFees', 'timeLeft', 'mapa',
            'products', 'userPreferences', 'calculatedZones', 'isTenantAdmin',
            'isReservation', 'user', 'eventName', 'displayImageUrl',
            'handleDelete', 'handleClear', 'handleSalaChange', 'handleAsignarButacas',
            'getZonaNombre', 'handleDescriptionChange', 'getRegionalConfig',
            'subscribeToRealtimeUpdates', 'handleTimerClick', 'handleLogin',
            'handleSavedReportsMenuClick', 'openSaveReportModal', 'savedReportsMenuItems',
            'existingPaymentId', 'profileData', 'setterName', 'mapasTest',
            'tenantData', 'tenantsTest', 'allFunciones', 'salaFunciones',
            'updatedData', 'currentSession', 'sessionError', 'loadingPlantillasProductos',
            'stageSize', 'imgRef', 'reportProgress', 'setTooltip', 'fileInputRef',
            'addSillasToMesa', 'limpiarSillasDuplicadas', 'snapToGridFunction',
            'panToCenter', 'zoomToFit', 'nuevaMesa', 'pointer', 'nuevaZona',
            'simpleData', 'status', 'isPermissionError', 'type', 'authParams',
            'zona', 'setSelectedZone', 'setShowZonesPanel', 'setShowHistoryPanel',
            'setShowPreviewMode', 'setMinScale', 'setMaxScale', 'setShowConnections',
            'setSeatStates', 'totalSteps', 'mapped', 'setCurrentPage', 'DEBUG',
            'rollbackExecuted', 'totalSteps', 'addToHistory', 'handleElementRotation',
            'isTemporarilySelected', 'useMapaState', 'useMapaSelection', 'useMapaGraphicalElements',
            'FilaPopup', 'IconSelector', 'Option', 'TextArea', 'showZonesPanel',
            'showHistoryPanel', 'showPreviewMode', 'CrearMapaEditor', 'useMemo',
            'useCallback', 'memo', 'logger', 'Navigate', 'supabaseAdmin',
            'RecintoSelector', 'TicketsList', 'validateAndCleanJsonField',
            'handleLocatorSearch', 'setCarrito', 'forceRefresh', 'cartItemsRaw',
            'seatStatesMapForColor', 'allLockedSeats', 'disableSeatClickThrottle',
            'seatStates', 'workerLoading', 'seatStatesVersion', 'imageUrl',
            'finalImageUrl', 'events', 'loadFacebookPixel', 'sendNotification',
            'loadStoredBuyerInfo', 'loadUserRole', 'loadPaymentMethods', 'loadAnalyticsData',
            'loadAuditLogs', 'loadRefunds', 'loadSettings', 'loadTags', 'fetchProfiles',
            'selectedPage', 'loadCupos', 'loadPlantillas', 'loadProductos', 'loadEventos',
            'loadPaquetes', 'loadFunciones', 'getPreview', 'metodos', 'setSelectedEvent',
            'setSelectedFuncion', 'handleFunctionSelect', 'loadAfiliados', 'loadStats',
            'loadComisiones', 'loadSavedReports', 'loadReportData', 'loadDashboardData',
            'loadSavedCarts', 'loadGatewayConfigs', 'loadData', 'loadZonasAndPrecios',
            'checkWishlistStatus', 'restoreCurrentSession', 'loadZonas', 'fetchIvas',
            'selectedEntradaId', 'selectedEvent', 'selectedFuncion', 'nuevaFuncion.fechaFinVenta',
            'nuevaFuncion.fechaInicioVenta', 'sincronizarFechasCanales', 'salaSeleccionada.id',
            'elements', 'history.length', 'seatShape', 'seatEmpty', 'protectedStatuses',
            'seatStatusMap', 'backgroundPosition', 'selectedIds', 'loadTenantData'
        ];

        let fixedContent = content;

        // Eliminar declaraciones de variables no usadas
        unusedVars.forEach(varName => {
            // Patrones para declaraciones de variables
            const patterns = [
                new RegExp(`\\b(const|let|var)\\s+${varName}\\s*=\\s*[^;]+;\\s*\\n`, 'g'),
                new RegExp(`\\b${varName}\\s*:\\s*[^,;\\n]+`, 'g'),
                new RegExp(`\\bfunction\\s+${varName}\\s*\\([^)]*\\)\\s*\\{[^}]*\\}`, 'g')
            ];

            patterns.forEach(pattern => {
                fixedContent = fixedContent.replace(pattern, '');
            });
        });

        return fixedContent;
    },

    // 4. Corregir mix de operadores
    fixMixedOperators: (content) => {
        return content
            .replace(/([^&|])\|\|([^&])/g, '$1 || $2')
            .replace(/([^|&])&&([^|])/g, '$1 && $2')
            .replace(/\(([^)]+)\s*[&|]\s*([^)]+)\)/g, '($1 $2)');
    },

    // 5. Eliminar BOM (Byte Order Mark)
    removeBOM: (content) => {
        if (content.charCodeAt(0) === 0xFEFF) {
            return content.slice(1);
        }
        return content;
    }
};

// Función principal para procesar archivos
function fixFile(filePath) {
    try {
        const fullPath = path.join(__dirname, filePath);
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  Archivo no encontrado: ${filePath}`);
            return;
        }

        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;

        console.log(`🔧 Procesando: ${filePath}`);

        // Aplicar todas las correcciones
        content = FIX_RULES.removeBOM(content);
        content = FIX_RULES.removeUnusedImports(content);
        content = FIX_RULES.removeUnusedVariables(content);
        content = FIX_RULES.fixMixedOperators(content);
        content = FIX_RULES.fixMissingDeps(content);

        // Solo guardar si hubo cambios
        if (content !== originalContent) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Corregido: ${filePath}`);
        } else {
            console.log(`✓ Sin cambios: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
    }
}

// Función para buscar archivos automáticamente
function findFilesWithIssues() {
    console.log('🔍 Buscando archivos con problemas de ESLint...');

    try {
        // Ejecutar ESLint para obtener lista de archivos problemáticos
        const result = execSync('npx eslint src --ext .js,.jsx --format json', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'] // Ignorar stderr
        });

        const eslintOutput = JSON.parse(result);
        const problematicFiles = [...new Set(eslintOutput.map(item => item.filePath))];

        return problematicFiles.map(file =>
            file.replace(process.cwd() + path.sep, '')
        );
    } catch (error) {
        console.log('⚠️  No se pudo ejecutar ESLint, usando lista prioritaria...');
        return PRIORITY_FILES;
    }
}

// Función principal
async function main() {
    console.log('🚀 INICIANDO CORRECCIÓN AUTOMÁTICA DE ESLINT\n');

    // Opción 1: Usar archivos prioritarios
    // const filesToFix = PRIORITY_FILES;

    // Opción 2: Buscar automáticamente archivos problemáticos
    const filesToFix = findFilesWithIssues();

    console.log(`📋 Encontrados ${filesToFix.length} archivos para corregir\n`);

    // Procesar cada archivo
    filesToFix.forEach((file, index) => {
        console.log(`[${index + 1}/${filesToFix.length}]`);
        fixFile(file);
    });

    console.log('\n✨ PROCESO COMPLETADO');
    console.log('\n📝 Pasos siguientes recomendados:');
    console.log('1. Ejecutar tests: npm test');
    console.log('2. Verificar build: npm run build');
    console.log('3. Revisar manualmente los TODOs en el código');
    console.log('4. Ejecutar ESLint nuevamente: npx eslint src --ext .js,.jsx');
}

// Ejecutar
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { fixFile, FIX_RULES };