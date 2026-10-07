// @ts-check
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dir, '..');

// Parse .env manually — no dotenv dependency needed
const envPath = resolve(repoRoot, '.env');
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim()];
    })
);

const databaseUrl = envVars.DIRECT_URL;
if (!databaseUrl) {
  console.error('DIRECT_URL not found in .env');
  process.exit(1);
}

const [, , command = 'up', ...passThroughArgs] = process.argv;
const migrationsDir = resolve(repoRoot, 'db', 'migrations');

// Resolve the JS entry point directly instead of the .cmd/.sh wrapper.
// On Windows, spawnSync cannot execute .cmd files without going through cmd.exe,
// and paths containing spaces break cmd.exe argument splitting. Invoking node
// directly with the JS file bypasses both problems entirely.
const migrateBin = resolve(repoRoot, 'node_modules', 'node-pg-migrate', 'bin', 'node-pg-migrate.js');

const defaultCommandArgs = command === 'up' ? ['--create-schema', '--check-order=false'] : [];

const cliArgs = [
  migrateBin,
  command,
  '--migrations-dir', migrationsDir,
  '--schema', 'public',
  '--decamelize',
  ...defaultCommandArgs,
  ...passThroughArgs,
];

const result = spawnSync(process.execPath, cliArgs, {
  stdio: 'inherit',
  shell: false,
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

process.exit(result.status ?? 1);
