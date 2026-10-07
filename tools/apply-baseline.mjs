// @ts-check
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dir, '..');
const baselineDir = resolve(repoRoot, 'db', 'baseline');

const dryRun = process.argv.includes('--dry-run');

const schemaSql = readFileSync(resolve(baselineDir, 'schema.sql'), 'utf8');
/** @type {string[]} */
const migrationNames = JSON.parse(readFileSync(resolve(baselineDir, 'applied-migrations.json'), 'utf8'));

const count = (/** @type {RegExp} */ pattern) => (schemaSql.match(pattern) ?? []).length;
const summary = {
  tables: count(/^CREATE TABLE /gm),
  functions: count(/^CREATE OR REPLACE FUNCTION /gm),
  policies: count(/^CREATE POLICY /gm),
  triggers: count(/^CREATE TRIGGER /gm),
  migrationsMarkedApplied: migrationNames.length,
};

if (dryRun) {
  console.log('Dry run: no connection made, nothing written.');
  console.log(JSON.stringify(summary));
  process.exit(0);
}

const envVars = Object.fromEntries(
  readFileSync(resolve(repoRoot, '.env'), 'utf8')
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim()];
    })
);

const url = envVars.DIRECT_URL;
if (!url) {
  console.error('DIRECT_URL not found in .env');
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });

try {
  const [existing] = await sql`
    SELECT to_regclass('public.runs') IS NOT NULL AS has_runs,
           to_regclass('public.users') IS NOT NULL AS has_users`;
  if (existing.has_runs || existing.has_users) {
    console.error(
      'Refusing to apply the baseline: public.runs and/or public.users already exist.\n' +
        'This database is not empty. Use `npm run db:migrate` to bring an existing database up to date.'
    );
    process.exitCode = 1;
  } else {
    await sql.begin(async (tx) => {
      await tx.unsafe(schemaSql);
      await tx.unsafe(`
        CREATE TABLE public.pgmigrations (
          id serial PRIMARY KEY,
          name varchar(255) NOT NULL,
          run_on timestamp NOT NULL
        )`);
      for (const name of migrationNames) {
        await tx`INSERT INTO public.pgmigrations (name, run_on) VALUES (${name}, now())`;
      }
    });
    console.log('Baseline applied and committed.');
    console.log(JSON.stringify(summary));
    console.log('Next: run `npm run db:migrate` (it should report nothing to run until new migrations are added).');
  }
} finally {
  await sql.end();
}
