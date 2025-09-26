// Script para analizar el código del CrearMapaEditor
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/CrearMapa/CrearMapaEditor.jsx');
const content = fs.readFileSync(filePath, 'utf8');

console.log('🔍 [ANÁLISIS] Analizando CrearMapaEditor.jsx...\n');

// 1. Hooks importados
const importedHooks = [
  'useMapaElements',
  'useMapaState', 
  'useMapaSelection',
  'useMapaZoomStage',
  'useMapaGraphicalElements',
  'useMapaLoadingSaving',
  'useMapaZones'
];

console.log('📋 [HOOKS IMPORTADOS]');
importedHooks.forEach(hook => {
  const isUsed = content.includes(hook) && content.indexOf(hook) !== content.lastIndexOf(hook);
  console.log(`  ${isUsed ? '✅' : '❌'} ${hook} - ${isUsed ? 'USADO' : 'NO USADO'}`);
});

// 2. Estados de background
const backgroundStates = [
  'backgroundImage',
  'backgroundImageElement', 
  'backgroundScale',
  'backgroundOpacity',
  'showBackgroundInWeb',
  'backgroundPosition',
  'backgroundFilters',
  'showBackgroundFilters'
];

console.log('\n🖼️ [ESTADOS DE BACKGROUND]');
backgroundStates.forEach(state => {
  const count = (content.match(new RegExp(state, 'g')) || []).length;
  console.log(`  ${state}: ${count} usos`);
});

// 3. Funciones de background
const backgroundFunctions = [
  'setBackgroundImage',
  'setBackgroundImageElement',
  'setBackgroundScale', 
  'setBackgroundOpacity',
  'setShowBackgroundInWeb',
  'setBackgroundPosition',
  'setBackgroundFilters',
  'setShowBackgroundFilters',
  'setBackgroundImageFunction',
  'updateBackground',
  'removeBackground'
];

console.log('\n🔧 [FUNCIONES DE BACKGROUND]');
backgroundFunctions.forEach(func => {
  const count = (content.match(new RegExp(func, 'g')) || []).length;
  console.log(`  ${func}: ${count} usos`);
});

// 4. useEffects
const useEffectMatches = content.match(/useEffect\(/g);
console.log(`\n⚡ [USEEFFECTS] Total: ${useEffectMatches ? useEffectMatches.length : 0}`);

// 5. useStates
const useStateMatches = content.match(/useState\(/g);
console.log(`\n📊 [USESTATES] Total: ${useStateMatches ? useStateMatches.length : 0}`);

// 6. useCallbacks
const useCallbackMatches = content.match(/useCallback\(/g);
console.log(`\n🔄 [USECALLBACKS] Total: ${useCallbackMatches ? useCallbackMatches.length : 0}`);

// 7. useMemos
const useMemoMatches = content.match(/useMemo\(/g);
console.log(`\n💾 [USEMEMOS] Total: ${useMemoMatches ? useMemoMatches.length : 0}`);

// 8. Imports no usados
const imports = [
  'useMapaState',
  'useMapaSelection', 
  'useMapaGraphicalElements',
  'useMapaLoadingSaving',
  'useMapaZones'
];

console.log('\n🗑️ [IMPORTS NO USADOS]');
imports.forEach(importName => {
  const isUsed = content.includes(importName) && content.indexOf(importName) !== content.lastIndexOf(importName);
  if (!isUsed) {
    console.log(`  ❌ ${importName}`);
  }
});

// 9. Componentes importados
const components = [
  'BackgroundFilterMenu',
  'BackgroundImageManager'
];

console.log('\n🧩 [COMPONENTES DE BACKGROUND]');
components.forEach(comp => {
  const count = (content.match(new RegExp(comp, 'g')) || []).length;
  console.log(`  ${comp}: ${count} usos`);
});

console.log('\n✅ [ANÁLISIS COMPLETADO]');
