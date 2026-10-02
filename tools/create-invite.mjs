// @ts-check
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';
import pg from 'pg';

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

const email = process.argv[2];
if (!email) {
  console.error('Usage: node tools/create-invite.mjs <email>');
  process.exit(1);
}

const token = randomBytes(24).toString('base64url');
const appUrl = envVars.APP_URL || 'http://localhost:3000';

const client = new pg.Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query(
    `INSERT INTO public.invites (email, token, expires_at)
     VALUES ($1, $2, now() + interval '7 days')`,
    [email, token]
  );
  console.log(`Invite created for ${email}`);
  console.log(`${appUrl}/signup?invite=${token}`);
} catch (err) {
  console.error('Failed to create invite:', err);
  process.exit(1);
} finally {
  await client.end();
}
