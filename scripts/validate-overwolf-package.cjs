const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'overwolf', 'manifest.json');
const distDir = path.join(root, 'dist-overwolf');
const requireProductionApi = process.argv.includes('--require-production-api');

const errors = [];
const warnings = [];

const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${filePath}: invalid JSON (${error.message})`);
    return null;
  }
};

const fileExists = (relativePath) => fs.existsSync(path.join(distDir, relativePath));

const readDesktopApiBaseUrl = () => {
  const filePath = path.join(distDir, 'desktop-config.js');
  if (!fs.existsSync(filePath)) {
    errors.push('dist-overwolf/desktop-config.js is missing');
    return '';
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/apiBaseUrl:\s*["']([^"']+)["']/);
  if (!match) {
    errors.push('dist-overwolf/desktop-config.js does not expose apiBaseUrl');
    return '';
  }

  return match[1];
};

const inspectIco = (relativePath) => {
  const filePath = path.join(distDir, relativePath);
  if (!fs.existsSync(filePath)) {
    errors.push(`${relativePath} is referenced by manifest but is missing from dist-overwolf`);
    return;
  }

  const size = fs.statSync(filePath).size;
  if (size > 150 * 1024) {
    warnings.push(`${relativePath} is larger than 150KB; Overwolf launcher icons should stay below this.`);
  }

  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 6 || buffer.readUInt16LE(0) !== 0 || buffer.readUInt16LE(2) !== 1) {
    warnings.push(`${relativePath} is not a standard ICO file header.`);
    return;
  }

  const count = buffer.readUInt16LE(4);
  const sizes = [];
  for (let index = 0; index < count; index += 1) {
    const offset = 6 + index * 16;
    if (offset + 16 > buffer.length) {
      break;
    }

    const width = buffer[offset] || 256;
    const height = buffer[offset + 1] || 256;
    sizes.push(`${width}x${height}`);
  }

  ['16x16', '32x32', '48x48', '256x256'].forEach((requiredSize) => {
    if (!sizes.includes(requiredSize)) {
      warnings.push(`${relativePath} does not advertise ${requiredSize}; found: ${sizes.join(', ') || 'none'}.`);
    }
  });
};

const inspectPng = (relativePath, expectedSize = 256, maxBytes = 30 * 1024) => {
  const filePath = path.join(distDir, relativePath);
  if (!fs.existsSync(filePath)) {
    errors.push(`${relativePath} is referenced by manifest but is missing from dist-overwolf`);
    return;
  }

  const buffer = fs.readFileSync(filePath);
  if (buffer.length > maxBytes) {
    warnings.push(`${relativePath} is larger than ${Math.round(maxBytes / 1024)}KB.`);
  }

  if (
    buffer.length < 24 ||
    buffer.toString('ascii', 1, 4) !== 'PNG' ||
    buffer.toString('ascii', 12, 16) !== 'IHDR'
  ) {
    warnings.push(`${relativePath} is not a standard PNG file.`);
    return;
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width !== expectedSize || height !== expectedSize) {
    warnings.push(`${relativePath} should be ${expectedSize}x${expectedSize}; found ${width}x${height}.`);
  }
};

const manifest = readJson(manifestPath);

if (manifest) {
  if (manifest.manifest_version !== 1) {
    errors.push('manifest_version must be 1 for this Overwolf Native package.');
  }

  if (manifest.type !== 'WebApp') {
    errors.push('manifest type must be WebApp.');
  }

  ['name', 'author', 'version', 'description', 'launcher_icon', 'icon', 'icon_gray', 'window_icon'].forEach((key) => {
    if (!manifest.meta?.[key]) {
      errors.push(`manifest meta.${key} is required for QA submission.`);
    }
  });

  if (manifest.meta?.name !== 'CRM Atlant Desktop') {
    warnings.push(`manifest meta.name changed to "${manifest.meta?.name}". Keep name stable after first submission.`);
  }

  if (manifest.meta?.author !== 'CRM Atlant') {
    warnings.push(`manifest meta.author changed to "${manifest.meta?.author}". Keep author stable after first submission.`);
  }

  const windows = manifest.data?.windows || {};
  ['desktop', 'post_match', 'notes_overlay'].forEach((windowName) => {
    if (!windows[windowName]) {
      errors.push(`manifest data.windows.${windowName} is required by the QA checklist.`);
    }
  });

  Object.values(windows).forEach((windowConfig) => {
    if (windowConfig?.file && !fileExists(windowConfig.file.split('?')[0])) {
      errors.push(`Window file ${windowConfig.file} is missing from dist-overwolf.`);
    }
  });

  const iconPaths = new Set([
    manifest.meta?.launcher_icon,
    manifest.meta?.icon,
    manifest.meta?.icon_gray,
    manifest.meta?.window_icon,
  ].filter(Boolean));

  iconPaths.forEach((iconPath) => {
    if (String(iconPath).toLowerCase().endsWith('.ico')) {
      inspectIco(iconPath);
    } else if (String(iconPath).toLowerCase().endsWith('.png')) {
      inspectPng(iconPath);
    } else if (!fileExists(iconPath)) {
      errors.push(`${iconPath} is referenced by manifest but is missing from dist-overwolf`);
    }
  });
}

if (!fs.existsSync(distDir)) {
  errors.push('dist-overwolf directory is missing. Run npm run build:overwolf first.');
} else {
  ['index.html', 'manifest.json', 'desktop-config.js', 'assets'].forEach((entry) => {
    if (!fs.existsSync(path.join(distDir, entry))) {
      errors.push(`dist-overwolf/${entry} is missing.`);
    }
  });

  const apiBaseUrl = readDesktopApiBaseUrl();
  if (apiBaseUrl) {
    const isLocalApiUrl = /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])/i.test(apiBaseUrl);
    if (requireProductionApi && (!/^https:\/\//i.test(apiBaseUrl) || isLocalApiUrl)) {
      errors.push(`QA OPK requires a production HTTPS apiBaseUrl, got ${apiBaseUrl}`);
    } else if (isLocalApiUrl) {
      warnings.push(`dist-overwolf uses local apiBaseUrl (${apiBaseUrl}); this is not sendable to Overwolf QA.`);
    }
  }
}

warnings.forEach((warning) => console.warn(`[overwolf:validate] warning: ${warning}`));

if (errors.length > 0) {
  errors.forEach((error) => console.error(`[overwolf:validate] error: ${error}`));
  process.exit(1);
}

console.log('[overwolf:validate] package structure looks ready for QA checks.');
