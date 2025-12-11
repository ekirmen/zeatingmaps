// eslint-clean.js
const { ESLint } = require('eslint');
const fs = require('fs');
const path = require('path');

async function fixUnusedImports() {
  console.log('🔧 Corrigiendo imports no usados con ESLint...\n');
  
  const eslint = new ESLint({
    fix: true,
    useEslintrc: true,
    cwd: process.cwd()
  });

  const results = await eslint.lintFiles(['src/**/*.{js,jsx,ts,tsx}']);
  
  let fixedCount = 0;
  
  results.forEach(result => {
    if (result.output) {
      fs.writeFileSync(result.filePath, result.output, 'utf8');
      fixedCount++;
      
      // Mostrar qué se arregló
      const messages = result.messages.filter(m => m.ruleId === 'no-unused-vars');
      if (messages.length > 0) {
        console.log(`📄 ${path.relative(process.cwd(), result.filePath)}:`);
        messages.forEach(msg => {
          console.log(`   - ${msg.message} (línea ${msg.line})`);
        });
      }
    }
  });
  
  console.log(`\n✅ Archivos corregidos: ${fixedCount}`);
  
  // Aplicar formateo después
  await ESLint.outputFixes(results);
}

fixUnusedImports().catch(console.error);