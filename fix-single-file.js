// fix-single-file.js
const fs = require('fs');
const path = require('path');

function fixBoleteriaFile() {
    const filePath = path.join(__dirname, 'src/backoffice/hooks/useBoleteria.js');

    if (!fs.existsSync(filePath)) {
        console.log('❌ Archivo no encontrado:', filePath);
        return;
    }

    console.log('🔧 Corrigiendo useBoleteria.js...');

    let content = fs.readFileSync(filePath, 'utf8');

    // CORREGIR EL ERROR ESPECÍFICO - Línea 139
    // Buscar y corregir el objeto con coma extra
    const lines = content.split('\n');

    // Encontrar la línea problemática
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('precio: precio,') &&
            lines[i + 1] &&
            lines[i + 1].trim() === ',') {
            console.log(`✅ Encontrado error en línea ${i + 2}`);

            // Eliminar la línea con solo coma
            lines.splice(i + 1, 1);

            // También buscar otros errores similares
            content = lines.join('\n');

            // Buscar y corregir el patrón exacto que causa el error
            content = content.replace(
                /const newItem = \{\s*[\s\S]*?precio: precio,\s*,\s*funcionId:/,
                `const newItem = {
      id: asiento.id || asiento._id,
      asiento: asiento,
      precio: precio,
      funcionId:`
            );

            break;
        }
    }

    // También buscar el patrón problemático específico
    const problematicPattern = /      asiento: asiento,\n      precio: precio,\n      ,/g;
    if (problematicPattern.test(content)) {
        console.log('✅ Corrigiendo patrón problemático...');
        content = content.replace(
            problematicPattern,
            `      asiento: asiento,
      precio: precio,`
        );
    }

    // GUARDAR EL ARCHIVO CORREGIDO
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Archivo corregido exitosamente');

    // Mostrar las líneas corregidas
    console.log('\n📄 Líneas corregidas:');
    const newLines = content.split('\n');
    for (let i = 135; i <= 145; i++) {
        if (newLines[i]) {
            console.log(`${i + 1}: ${newLines[i]}`);
        }
    }
}

// Función alternativa: Reemplazo directo
function fixWithDirectReplacement() {
    const filePath = path.join(__dirname, 'src/backoffice/hooks/useBoleteria.js');

    if (!fs.existsSync(filePath)) {
        console.log('❌ Archivo no encontrado');
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Reemplazar la función addToCarrito completa con versión corregida
    const oldFunction = `  // Función para agregar asiento al carrito
  const addToCarrito = useCallback((asiento, precio, zona) => {
    const newItem = {
      id: asiento.id  ||  asiento._id,
      asiento: asiento,
      precio: precio,
      ,
      funcionId: selectedFuncion?.id,
      timestamp: Date.now()
    };`;

    const newFunction = `  // Función para agregar asiento al carrito
  const addToCarrito = useCallback((asiento, precio, zona) => {
    const newItem = {
      id: asiento.id || asiento._id,
      asiento: asiento,
      precio: precio,
      funcionId: selectedFuncion?.id,
      timestamp: Date.now()
    };`;

    if (content.includes(oldFunction)) {
        console.log('✅ Reemplazando función addToCarrito...');
        content = content.replace(oldFunction, newFunction);

        // También corregir otros errores comunes en el archivo
        content = content.replace(/  & /g, ' && ');
        content = content.replace(/\|  \|/g, ' || ');

        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ Archivo corregido exitosamente');
    } else {
        console.log('⚠️  No se encontró el patrón exacto, intentando corrección alternativa...');

        // Corrección más agresiva
        content = content.replace(
            /precio: precio,\s*\n\s*,/g,
            'precio: precio,'
        );

        content = content.replace(
            /,\s*\n\s*funcionId:/g,
            ',\n      funcionId:'
        );

        fs.writeFileSync(filePath, content, 'utf8');
        console.log('✅ Aplicada corrección alternativa');
    }
}

// Función principal con opciones
function main() {
    console.log('🎯 CORRECCIÓN DE ERROR DE SINTAXIS\n');
    console.log('1. Corregir solo el error específico (recomendado)');
    console.log('2. Reemplazar toda la función addToCarrito');
    console.log('3. Ver el contenido problemático actual');
    console.log('4. Restaurar desde backup\n');

    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.question('Opción (1-4): ', (option) => {
        switch (option) {
            case '1':
                fixBoleteriaFile();
                break;
            case '2':
                fixWithDirectReplacement();
                break;
            case '3':
                showProblematicContent();
                break;
            case '4':
                restoreFromBackup();
                break;
            default:
                console.log('❌ Opción no válida');
        }
        readline.close();

        console.log('\n📝 EJECUTA AHORA:');
        console.log('npm run build dev');
    });
}

function showProblematicContent() {
    const filePath = path.join(__dirname, 'src/backoffice/hooks/useBoleteria.js');

    if (!fs.existsSync(filePath)) {
        console.log('❌ Archivo no encontrado');
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    console.log('\n📄 LÍNEAS 130-150 DEL ARCHIVO:\n');
    console.log('='.repeat(80));

    for (let i = 130; i <= 150; i++) {
        if (lines[i]) {
            console.log(`${i + 1}: ${lines[i]}`);
        }
    }

    console.log('='.repeat(80));
}

function restoreFromBackup() {
    const filePath = path.join(__dirname, 'src/backoffice/hooks/useBoleteria.js');
    const backupPath = filePath + '.backup';

    if (!fs.existsSync(backupPath)) {
        console.log('❌ No hay backup disponible');
        console.log('💡 Creando backup antes de continuar...');

        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            fs.writeFileSync(backupPath, content, 'utf8');
            console.log('✅ Backup creado:', backupPath);
        }
        return;
    }

    console.log('🔄 Restaurando desde backup...');
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    fs.writeFileSync(filePath, backupContent, 'utf8');
    console.log('✅ Archivo restaurado desde backup');
}

// Si se ejecuta directamente, usar corrección automática
if (require.main === module) {
    // Ejecutar corrección automática
    console.log('🚀 EJECUTANDO CORRECCIÓN AUTOMÁTICA\n');

    try {
        fixWithDirectReplacement();
        console.log('\n✅ ¡Corrección completada!');
        console.log('🔧 Ahora ejecuta: npm run build dev');
    } catch (error) {
        console.error('❌ Error durante la corrección:', error.message);
        console.log('\n💡 Intenta ejecutar:');
        console.log('node -e "require(\'./fix-single-file\').restoreFromBackup()"');
    }
}

module.exports = {
    fixBoleteriaFile,
    fixWithDirectReplacement,
    showProblematicContent,
    restoreFromBackup
};