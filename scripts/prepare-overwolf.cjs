const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist-overwolf');
const manifestPath = path.join(root, 'overwolf', 'manifest.json');

if (!fs.existsSync(distDir)) {
  throw new Error(`Overwolf build directory not found: ${distDir}`);
}

fs.copyFileSync(manifestPath, path.join(distDir, 'manifest.json'));

console.log(`Prepared Overwolf package in ${distDir}`);
