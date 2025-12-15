// find-problems-exact.js
const fs = require('fs');
const path = require('path');

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let braceStack = [];
  let problems = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    
    for (let j = 0; j < openBraces; j++) {
      braceStack.push({ line: i+1, char: line.indexOf('{', j) });
    }
    
    for (let j = 0; j < closeBraces; j++) {
      if (braceStack.length > 0) {
        braceStack.pop();
      } else {
        problems.push(`Línea ${i+1}: Llave de cierre sin apertura`);
      }
    }
  }
  
  if (braceStack.length > 0) {
    braceStack.forEach(brace => {
      problems.push(`Línea ${brace.line}: Llave de apertura sin cierre`);
    });
  }
  
  return problems;
}

const files = [
  'src/store/pages/ModernEventPage.jsx',
  'src/store/services/paymentGatewaysService.js',
  'src/utils/indexedDBCache.js'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`\n🔍 ${file}:`);
    const problems = analyzeFile(file);
    if (problems.length > 0) {
      problems.slice(0, 10).forEach(p => console.log(`  ${p}`));
      if (problems.length > 10) console.log(`  ... y ${problems.length - 10} más`);
    } else {
      console.log('  ✅ OK');
    }
  }
});