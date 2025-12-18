const fs = require('fs');
const path = require('path');

const statsPath = path.join(__dirname, 'build', 'stats.json');

try {
    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    const assets = stats.assets || [];

    let output = '--- Top 50 Assets by Size ---\n';
    assets.sort((a, b) => b.size - a.size);
    assets.slice(0, 50).forEach(asset => {
        output += `${asset.name}: ${(asset.size / 1024 / 1024).toFixed(4)} MB\n`;
    });

    output += '\n--- Entrypoints ---\n';
    for (const [key, value] of Object.entries(stats.entrypoints || {})) {
        output += `${key}:\n`;
        value.assets.forEach(a => output += `  - ${a.name} (${(a.size / 1024).toFixed(2)} KB)\n`);
    }

    fs.writeFileSync('analysis_output.txt', output);
    console.log('Analysis written to analysis_output.txt');

} catch (err) {
    fs.writeFileSync('analysis_output.txt', `Error: ${err.message}`);
    console.error(err);
}
