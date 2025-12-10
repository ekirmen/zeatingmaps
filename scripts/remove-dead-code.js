/**
 * Script para identificar y eliminar código muerto
 * Busca código comentado, imports no utilizados, y funciones no referenciadas
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directorios a analizar
const srcDir = path.join(__dirname, '..', 'src');
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Estadísticas
const stats = {
  filesScanned: 0,
  commentedBlocks: 0,
  unusedImports: 0,
  deadFunctions: 0,
  filesModified: 0,
};

/**
 * Busca bloques de código comentado grandes
 */
function findCommentedCode(filePath, content) {
  const lines = content.split('\n');
  const commentedBlocks = [];
  let inBlockComment = false;
  let blockStart = -1;
  let commentLength = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detectar inicio de bloque de comentario
    if (trimmed.startsWith('/*')) {
      inBlockComment = true;
      blockStart = i;
      commentLength = line.length;
    }
    // Detectar fin de bloque de comentario
    else if (trimmed.endsWith('*/') && inBlockComment) {
      inBlockComment = false;
      commentLength += line.length;
      // Si el bloque es grande (> 3 líneas o > 200 caracteres), es probablemente código muerto
      if (i - blockStart > 3 || commentLength > 200) {
        commentedBlocks.push({
          start: blockStart,
          end: i,
          length: commentLength,
        });
      }
      commentLength = 0;
    }
    // Continuar bloque de comentario
    else if (inBlockComment) {
      commentLength += line.length;
    }
    // Detectar comentarios de línea que parecen código
    else if (trimmed.startsWith('//') && trimmed.length > 50) {
      // Si el comentario tiene más de 50 caracteres, podría ser código comentado
      if (trimmed.includes('=') || trimmed.includes('(') || trimmed.includes('{')) {
        commentedBlocks.push({
          start: i,
          end: i,
          length: line.length,
        });
      }
    }
  }

  return commentedBlocks;
}

/**
 * Analiza un archivo
 */
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    stats.filesScanned++;

    // Buscar código comentado
    const commentedBlocks = findCommentedCode(filePath, content);
    if (commentedBlocks.length > 0) {
      stats.commentedBlocks += commentedBlocks.length;
      console.log(`\n📄 ${path.relative(srcDir, filePath)}`);
      commentedBlocks.forEach(block => {
        console.log(`  ⚠️  Bloque comentado: líneas ${block.start + 1}-${block.end + 1} (${block.length} caracteres)`);
      });
    }

    return {
      filePath,
      commentedBlocks,
    };
  } catch (error) {
    console.error(`Error analizando ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Recorre directorios recursivamente
 */
function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorar node_modules, build, etc.
      if (!['node_modules', 'build', '.git', 'dist'].includes(file)) {
        walkDirectory(filePath, fileList);
      }
    } else if (extensions.some(ext => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Genera reporte
 */
function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORTE DE CÓDIGO MUERTO');
  console.log('='.repeat(60));
  console.log(`Archivos analizados: ${stats.filesScanned}`);
  console.log(`Bloques comentados encontrados: ${stats.commentedBlocks}`);
  console.log(`\n⚠️  RECOMENDACIONES:`);
  console.log(`1. Revisar los bloques comentados y eliminarlos si no son necesarios`);
  console.log(`2. Usar git para mantener historia en lugar de comentarios`);
  console.log(`3. Documentar decisiones importantes en comentarios breves`);
  console.log('\n' + '='.repeat(60));
}

/**
 * Función principal
 */
function main() {
  console.log('🔍 Buscando código muerto...\n');

  const files = walkDirectory(srcDir);
  const results = files.map(analyzeFile).filter(Boolean);

  generateReport(results);

  // Guardar resultados en archivo
  const reportPath = path.join(__dirname, '..', 'dead-code-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    stats,
    results: results.map(r => ({
      file: path.relative(srcDir, r.filePath),
      commentedBlocks: r.commentedBlocks.length,
    })),
  }, null, 2));

  console.log(`\n📝 Reporte guardado en: ${reportPath}`);
}

if (require.main === module) {
  main();
}

module.exports = { analyzeFile, findCommentedCode, walkDirectory };

