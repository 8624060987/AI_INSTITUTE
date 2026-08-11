const fs = require('fs');
const path = require('path');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  const srcStatic = path.join(__dirname, '..', '.next', 'static');
  const destStatic = path.join(__dirname, '..', 'public', '_next', 'static');

  console.log('> Copying .next/static to public/_next/static for Hostinger Apache compatibility...');
  
  if (fs.existsSync(destStatic)) {
    fs.rmSync(destStatic, { recursive: true, force: true });
  }
  
  if (fs.existsSync(srcStatic)) {
    copyDirRecursive(srcStatic, destStatic);
    console.log('✅ Successfully copied static assets to public/_next/static!');
  } else {
    console.warn('⚠️ Warning: .next/static directory not found.');
  }
} catch (err) {
  console.error('❌ Error copying static assets:', err);
}
