const { spawnSync } = require('child_process');

const apiBaseUrl = process.env.OVERWOLF_API_BASE_URL || '';

if (!apiBaseUrl) {
  console.error('[build:overwolf:qa] OVERWOLF_API_BASE_URL is required.');
  console.error('[build:overwolf:qa] Example: OVERWOLF_API_BASE_URL="https://api.example.com" npm run build:overwolf:qa');
  process.exit(1);
}

const run = (command, args, env = process.env) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

run('npm', ['run', 'build:overwolf'], {
  ...process.env,
  OVERWOLF_REQUIRE_PRODUCTION_API: '1',
});
run('npm', ['run', 'overwolf:package']);
