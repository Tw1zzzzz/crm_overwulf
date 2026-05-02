const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist-overwolf');
const manifestPath = path.join(root, 'overwolf', 'manifest.json');
const desktopConfigPath = path.join(distDir, 'desktop-config.js');
const indexPath = path.join(distDir, 'index.html');
const notesOverlayPath = path.join(distDir, 'notes_overlay.html');
const apiBaseUrl = process.env.OVERWOLF_API_BASE_URL || 'http://localhost:5001';
const requireProductionApi = process.env.OVERWOLF_REQUIRE_PRODUCTION_API === '1';

const isLocalApiUrl = (value) => /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])/i.test(value);

if (requireProductionApi && (!/^https:\/\//i.test(apiBaseUrl) || isLocalApiUrl(apiBaseUrl))) {
  throw new Error(
    'OVERWOLF_API_BASE_URL must be a production HTTPS URL when OVERWOLF_REQUIRE_PRODUCTION_API=1'
  );
}

if (!fs.existsSync(distDir)) {
  throw new Error(`Overwolf build directory not found: ${distDir}`);
}

fs.copyFileSync(manifestPath, path.join(distDir, 'manifest.json'));
fs.copyFileSync(indexPath, notesOverlayPath);
fs.writeFileSync(
  desktopConfigPath,
  `window.CRMATLANT_DESKTOP_CONFIG = window.CRMATLANT_DESKTOP_CONFIG || {\n  apiBaseUrl: ${JSON.stringify(apiBaseUrl)}\n};\n`
);

console.log(`Prepared Overwolf package in ${distDir}`);
console.log(`Overwolf API base URL: ${apiBaseUrl}`);
