const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist-overwolf');
const releaseDir = path.join(root, 'overwolf', 'release');
const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8'));
const version = manifest.meta?.version || '0.0.0';
const opkName = `crm-atlant-desktop-${version}-qa.opk`;
const opkPath = path.join(releaseDir, opkName);
const reportPath = path.join(releaseDir, `crm-atlant-desktop-${version}-qa-report.md`);
const desktopConfig = fs.readFileSync(path.join(distDir, 'desktop-config.js'), 'utf8');
const apiBaseUrl = desktopConfig.match(/apiBaseUrl:\s*["']([^"']+)["']/)?.[1] || 'unknown';

fs.mkdirSync(releaseDir, { recursive: true });
if (fs.existsSync(opkPath)) {
  fs.rmSync(opkPath);
}

const zipResult = spawnSync('zip', ['-rq', opkPath, '.'], {
  cwd: distDir,
  stdio: 'inherit',
});

if (zipResult.status !== 0) {
  throw new Error('Failed to create OPK archive. Make sure the zip command is available.');
}

const builtAt = new Date().toISOString();
const report = `# CRM Atlant Desktop Overwolf QA Report

- Build: ${opkName}
- Built at: ${builtAt}
- Manifest version: ${version}
- API base URL: ${apiBaseUrl}
- Package root: dist-overwolf

## Automated Checks

- [ ] npm run build:overwolf:qa
- [ ] npm run server:build
- [ ] npm run test:frontend
- [ ] npm run test:backend
- [ ] npm run test:programmer-fixes
- [ ] VirusTotal scan has no warnings

## Manual Overwolf QA Smoke

- [ ] Install OPK or unpacked build in Overwolf
- [ ] Desktop window opens and loads CRM
- [ ] Overwolf profile login works
- [ ] Production backend connection works
- [ ] notes_overlay opens in game
- [ ] Ctrl+Shift+N toggles notes
- [ ] Ctrl+Shift+M creates a note
- [ ] desktop, post_match, and notes_overlay sizes are usable
- [ ] Offline/API unavailable state is understandable

## QA Notes

- Test account:
- Known limitations:
`;

fs.writeFileSync(reportPath, report);

console.log(`[overwolf:package] created ${opkPath}`);
console.log(`[overwolf:package] created ${reportPath}`);
