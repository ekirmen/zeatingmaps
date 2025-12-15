// analyze-issues.js
const fs = require('fs');
const path = require('path');

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let issues = [];
  let braceStack = [];
  
  // Check for obvious incomplete patterns
  const incompletePatterns = [
    /export\s*$/,
    /return\s*$/,
    /=>\s*$/,
    /useCallback\(.*\)$/,
    /useEffect\(.*\)$/,
    /const\s+\w+\s*=\s*\(.*\)\s*=>\s*$/,
    /function\s+\w+\s*\(.*\)\s*\{?$/
  ];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Check for incomplete patterns
    incompletePatterns.forEach(pattern => {
      if (pattern.test(trimmed)) {
        issues.push({
          type: 'INCOMPLETE',
          line: index + 1,
          message: `Patrón incompleto: ${trimmed.substring(0, 50)}...`
        });
      }
    });
    
    // Count braces
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    
    // Check for single-line issues
    if (openBraces > 0 && closeBraces > 0) {
      // This line has both opening and closing braces - usually OK
    } else if (openBraces > 0) {
      braceStack.push({ line: index + 1, count: openBraces });
    } else if (closeBraces > 0) {
      if (braceStack.length === 0) {
        issues.push({
          type: 'UNMATCHED_CLOSE',
          line: index + 1,
          message: 'Llave de cierre sin apertura'
        });
      } else {
        braceStack.pop();
      }
    }
  });
  
  // Check for unclosed braces at end of file
  if (braceStack.length > 0) {
    braceStack.forEach(brace => {
      issues.push({
        type: 'UNCLOSED_OPEN',
        line: brace.line,
        message: 'Llave de apertura sin cierre'
      });
    });
  }
  
  return issues;
}

function main() {
  const srcDir = path.join(__dirname, 'src');
  const extensions = ['.js', '.jsx', '.ts', '.tsx'];
  
  console.log('🔍 Analizando problemas en archivos...\n');
  
  let totalIssues = 0;
  let filesWithIssues = 0;
  
  // Walk through all files
  function walk(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && 
          !item.includes('node_modules') && 
          !item.startsWith('.')) {
        walk(fullPath);
      } else if (extensions.some(ext => item.endsWith(ext))) {
        const issues = analyzeFile(fullPath);
        
        if (issues.length > 0) {
          filesWithIssues++;
          totalIssues += issues.length;
          
          console.log(`📄 ${path.relative(process.cwd(), fullPath)} (${issues.length} problemas):`);
          issues.slice(0, 3).forEach(issue => {
            console.log(`   Línea ${issue.line}: ${issue.message}`);
          });
          if (issues.length > 3) {
            console.log(`   ... y ${issues.length - 3} más`);
          }
          console.log('');
        }
      }
    }
  }
  
  walk(srcDir);
  
  console.log(`📊 Resumen:`);
  console.log(`   Archivos con problemas: ${filesWithIssues}`);
  console.log(`   Problemas totales: ${totalIssues}`);
  console.log(`\n🎯 Recomendaciones:`);
  console.log(`   1. Ejecuta: npm run format`);
  console.log(`   2. Luego: npm run lint:fix`);
  console.log(`   3. Para los problemas restantes, revisa manualmente los archivos mencionados arriba`);
}

main();