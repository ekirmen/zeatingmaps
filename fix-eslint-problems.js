// fix-syntax-errors.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Buscando errores de sintaxis...\n');

const errors = [];

function checkFileSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Problema 1: 'return' fuera de función
    if (content.match(/^\s*return\b/m)) {
      errors.push({
        file: filePath,
        line: content.split('\n').findIndex(line => line.includes('return')),
        problem: "'return' outside of function",
        fix: 'Mover el return dentro de una función o eliminar'
      });
    }
    
    // Problema 2: Llaves faltantes
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // Buscar export default sin llaves
      if (line.includes('export default') && !line.includes('{') && !line.includes('(')) {
        errors.push({
          file: filePath,
          line: index + 1,
          problem: "Missing braces after export default",
          fix: `Cambiar: "${line}" → "${line} {}"`
        });
      }
    });
    
    // Problema 3: await fuera de async
    const awaitRegex = /\bawait\b(?![^{]*\})/g;
    let match;
    while ((match = awaitRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      errors.push({
        file: filePath,
        line: lineNumber,
        problem: "await outside async function",
        fix: 'Mover await dentro de función async o agregar async'
      });
    }
    
  } catch (error) {
    console.error(`❌ Error leyendo ${filePath}:`, error.message);
  }
}

function scanDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.startsWith('.')) {
      scanDirectory(fullPath);
    } else if (/\.(js|jsx)$/.test(item)) {
      checkFileSyntax(fullPath);
    }
  });
}

// Archivos con problemas conocidos
const problemFiles = [
  'src/backoffice/pages/WebStudio.js',
  'src/backoffice/services/adminUsers.js',
  'src/components/Seat.js',
  'src/config/apiConfig.js',
  'src/utils/analytics.js'
];

// Revisar archivos problemáticos primero
problemFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    checkFileSyntax(fullPath);
  }
});

// Revisar todo src
scanDirectory(path.join(process.cwd(), 'src'));

// Mostrar resultados
console.log(`📊 Errores de sintaxis encontrados: ${errors.length}\n`);

if (errors.length > 0) {
  console.log('🚨 PROBLEMAS ENCONTRADOS:');
  errors.slice(0, 20).forEach((err, i) => {
    console.log(`\n${i + 1}. ${path.relative(process.cwd(), err.file)}`);
    console.log(`   Línea ${err.line}: ${err.problem}`);
    console.log(`   💡 Solución: ${err.fix}`);
  });
  
  if (errors.length > 20) {
    console.log(`\n... y ${errors.length - 20} más.`);
  }
  
  // Generar archivo de correcciones
  generateFixes();
}

function generateFixes() {
  console.log('\n🎯 Aplicando correcciones automáticas...');
  
  errors.forEach(err => {
    try {
      const content = fs.readFileSync(err.file, 'utf8');
      const lines = content.split('\n');
      
      if (err.problem.includes("'return' outside of function")) {
        // Si es un return al inicio, probablemente es un archivo que debe exportar algo
        if (err.line === 1 || err.line === 2) {
          const newContent = content.replace(/^\s*return\s+/, 'export default ');
          fs.writeFileSync(err.file, newContent, 'utf8');
          console.log(`✅ ${err.file}: Return convertido a export default`);
        } else {
          // Eliminar línea problemática
          lines[err.line - 1] = '';
          fs.writeFileSync(err.file, lines.join('\n'), 'utf8');
          console.log(`✅ ${err.file}: Línea ${err.line} eliminada`);
        }
      }
    } catch (error) {
      console.error(`❌ Error corrigiendo ${err.file}:`, error.message);
    }
  });
  
  console.log('\n🎉 Correcciones aplicadas. Ejecuta ESLint de nuevo.');
}