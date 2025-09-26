// Script para limpiar el CrearMapaEditor.jsx
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/CrearMapa/CrearMapaEditor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🧹 [LIMPIEZA] Iniciando limpieza de CrearMapaEditor.jsx...\n');

// 1. Eliminar imports no usados
const unusedImports = [
  'useMapaLoadingSaving',
  'useMapaZones'
];

console.log('🗑️ [ELIMINANDO IMPORTS NO USADOS]');
unusedImports.forEach(importName => {
  const importRegex = new RegExp(`import\\s*{[^}]*\\b${importName}\\b[^}]*}\\s*from\\s*'[^']*';?\\s*\\n?`, 'g');
  const beforeCount = (content.match(new RegExp(importName, 'g')) || []).length;
  content = content.replace(importRegex, '');
  const afterCount = (content.match(new RegExp(importName, 'g')) || []).length;
  console.log(`  ✅ ${importName}: ${beforeCount} → ${afterCount} referencias`);
});

// 2. Verificar si hay hooks importados pero no usados
const potentiallyUnusedHooks = [
  'useMapaState',
  'useMapaSelection', 
  'useMapaGraphicalElements'
];

console.log('\n🔍 [VERIFICANDO HOOKS POTENCIALMENTE NO USADOS]');
potentiallyUnusedHooks.forEach(hook => {
  const isUsed = content.includes(hook) && content.indexOf(hook) !== content.lastIndexOf(hook);
  console.log(`  ${isUsed ? '✅' : '❌'} ${hook} - ${isUsed ? 'USADO' : 'NO USADO'}`);
});

// 3. Buscar duplicaciones en el sistema de background
console.log('\n🖼️ [ANALIZANDO SISTEMA DE BACKGROUND]');

// Verificar si hay múltiples definiciones de backgroundImage
const backgroundImageDefs = (content.match(/const\s+\[backgroundImage/g) || []).length;
console.log(`  📊 Definiciones de backgroundImage: ${backgroundImageDefs}`);

// Verificar si hay múltiples useEffects para background
const backgroundUseEffects = (content.match(/useEffect\([^}]*background[^}]*\)/g) || []).length;
console.log(`  📊 useEffects relacionados con background: ${backgroundUseEffects}`);

// 4. Buscar funciones duplicadas o similares
console.log('\n🔧 [BUSCANDO FUNCIONES DUPLICADAS]');

// Buscar funciones que manejan background
const backgroundFunctions = [
  'setBackgroundImage',
  'updateBackground',
  'removeBackground'
];

backgroundFunctions.forEach(func => {
  const count = (content.match(new RegExp(func, 'g')) || []).length;
  console.log(`  📊 ${func}: ${count} usos`);
});

// 5. Verificar componentes de background
console.log('\n🧩 [COMPONENTES DE BACKGROUND]');
const backgroundComponents = [
  'BackgroundFilterMenu',
  'BackgroundImageManager'
];

backgroundComponents.forEach(comp => {
  const count = (content.match(new RegExp(comp, 'g')) || []).length;
  console.log(`  📊 ${comp}: ${count} usos`);
});

// 6. Estadísticas finales
console.log('\n📊 [ESTADÍSTICAS FINALES]');
const totalLines = content.split('\n').length;
const totalUseStates = (content.match(/useState\(/g) || []).length;
const totalUseEffects = (content.match(/useEffect\(/g) || []).length;
const totalUseCallbacks = (content.match(/useCallback\(/g) || []).length;

console.log(`  📏 Líneas totales: ${totalLines}`);
console.log(`  📊 useState: ${totalUseStates}`);
console.log(`  ⚡ useEffect: ${totalUseEffects}`);
console.log(`  🔄 useCallback: ${totalUseCallbacks}`);

// 7. Guardar archivo limpio
const outputPath = path.join(__dirname, '../src/components/CrearMapa/CrearMapaEditor.jsx.cleaned');
fs.writeFileSync(outputPath, content);
console.log(`\n💾 [ARCHIVO LIMPIO GUARDADO] ${outputPath}`);

console.log('\n✅ [LIMPIEZA COMPLETADA]');
