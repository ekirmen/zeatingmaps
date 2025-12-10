#!/usr/bin/env node

/**
 * Script para reducir console.logs de desarrollo
 * Mantiene solo console.error y algunos logs críticos
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Reduciendo console.logs de desarrollo...\n');

const srcDir = path.join(process.cwd(), 'src');
let filesProcessed = 0;
let logsRemoved = 0;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalLength = content.length;
    let originalLogCount = (content.match(/console\.(log|warn|debug)\(/g) || []).length;
    
    // Eliminar console.logs de debug (mantener console.error)
    // Patrones a eliminar:
    // - console.log('🔍', ...)
    // - console.log('✅', ...)
    // - console.log('❌', ...)
    // - console.log('🔧', ...)
    // - console.log('[DEBUG]', ...)
    // - console.log('[INFO]', ...)
    // - console.warn/console.debug de desarrollo
    
    // Regex para encontrar líneas completas con console.log/warn/debug
    const patterns = [
      // Eliminar console.log con emojis o prefijos de debug
      /^\s*console\.(log|warn|debug)\([^)]*['"`](🔍|✅|❌|🔧|⚠️|📊|💡|🎉|🧹|🔄|🆕|🔴|🟢|🟡|🔵|🟣|🟠|⚪|⚫|🟤|⬜|⬛|🟥|🟧|🟨|🟩|🟦|🟪|🟫)[^)]*\);?\s*$/gm,
      // Eliminar console.log con prefijos [DEBUG], [INFO], etc
      /^\s*console\.(log|warn|debug)\([^)]*['"`]\[(DEBUG|INFO|LOG|TRACE|VERBOSE)\][^)]*\);?\s*$/gim,
      // Eliminar console.log simples de desarrollo (con cuidado)
      // Solo si están en bloques de debug
      /^\s*\/\/ Debug logs?\s*$/gm,
      /^\s*\/\/ Debug adicional\s*$/gm,
      /^\s*console\.(log|warn|debug)\(['"`][^'"`]*debug[^'"`]*['"`][^)]*\);?\s*$/gim,
    ];
    
    let modified = content;
    patterns.forEach(pattern => {
      modified = modified.replace(pattern, '');
    });
    
    // Limpiar líneas vacías múltiples
    modified = modified.replace(/\n{3,}/g, '\n\n');
    
    const newLogCount = (modified.match(/console\.(log|warn|debug)\(/g) || []).length;
    const logsRemovedInFile = originalLogCount - newLogCount;
    
    if (logsRemovedInFile > 0) {
      fs.writeFileSync(filePath, modified);
      filesProcessed++;
      logsRemoved += logsRemovedInFile;
      const saved = originalLength - modified.length;
      console.log(`  ✅ ${filePath.replace(process.cwd(), '')}: ${logsRemovedInFile} logs eliminados (${saved} bytes)`);
    }
  } catch (error) {
    // Ignorar errores de lectura
  }
}

function findFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      findFiles(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      // Solo procesar archivos con más de 5 console.logs
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const logCount = (content.match(/console\.(log|warn|debug)\(/g) || []).length;
        if (logCount > 5) {
          processFile(filePath);
        }
      } catch (error) {
        // Ignorar errores
      }
    }
  });
}

console.log('🔍 Buscando archivos con muchos console.logs...\n');
findFiles(srcDir);

console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN');
console.log('='.repeat(50));
console.log(`✅ Archivos procesados: ${filesProcessed}`);
console.log(`🗑️  Console.logs eliminados: ${logsRemoved}`);
console.log('\n💡 Nota: Se mantienen console.error para errores críticos');
console.log('\n🎉 Reducción de logs completada!');

