const fs = require('fs');
const path = require('path');

const chunksDir = path.join(__dirname, '..', '.next', 'static', 'chunks');

if (fs.existsSync(chunksDir)) {
  const files = fs.readdirSync(chunksDir);
  const largestCss = files
    .filter(f => f.endsWith('.css'))
    .map(f => ({ name: f, size: fs.statSync(path.join(chunksDir, f)).size }))
    .sort((a, b) => b.size - a.size)[0];

  if (largestCss) {
    const mainCssPath = path.join(chunksDir, largestCss.name);
    console.log(`Found main CSS bundle: ${largestCss.name} (${largestCss.size} bytes)`);

    // List of legacy or hash chunk names to alias to ensure zero 404 CSS errors
    const aliases = [
      '2roups7jfolda.css',
      '24zajq831_ntf.css',
      '3etl0lmc3qm4e.css',
      'globals.css',
      'style.css'
    ];

    aliases.forEach(alias => {
      const aliasPath = path.join(chunksDir, alias);
      try {
        fs.copyFileSync(mainCssPath, aliasPath);
        console.log(`Created CSS alias: ${alias} -> ${largestCss.name}`);
      } catch (e) {
        console.error(`Failed to create alias ${alias}:`, e);
      }
    });
  }
}
