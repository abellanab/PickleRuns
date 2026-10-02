// @ts-check
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { Resend } from 'resend';

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
  console.error('Usage: node tools/approve-host.mjs <email>');
  process.exit(1);
}

const client = new pg.Client({ connectionString: databaseUrl });

/** @type {string | undefined} */
let approvedTo;
/** @type {string} */
let approvedName = 'baller';

try {
  await client.connect();

  // public.users holds display_name but not email; auth.users holds the email.
  // This CLI runs on DIRECT_URL as the postgres role, so it can read auth.users.
  const resolved = await client.query(
    `SELECT au.id AS user_id, au.email AS email, pu.display_name AS display_name
       FROM auth.users au
       JOIN public.users pu ON pu.id = au.id
      WHERE lower(au.email) = lower($1)
      LIMIT 1`,
    [email]
  );

  const row = resolved.rows[0];
  if (!row) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  approvedTo = row.email;
  if (row.display_name && String(row.display_name).trim()) {
    approvedName = row.display_name;
  }

  // Admin grant: update the latest request to approved, or insert an approved row
  // if the user never submitted one.
  const updated = await client.query(
    `UPDATE public.host_requests
        SET status = 'approved', decided_at = now()
      WHERE id = (
        SELECT id FROM public.host_requests
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1
      )
      RETURNING id`,
    [row.user_id]
  );

  if (updated.rowCount === 0) {
    await client.query(
      `INSERT INTO public.host_requests (user_id, status, decided_at)
       VALUES ($1, 'approved', now())`,
      [row.user_id]
    );
  }

  console.log(`Host access approved for ${approvedTo}`);
} catch (err) {
  console.error('Failed to approve host:', err);
  process.exit(1);
} finally {
  await client.end();
}

// Send the approval email. A failed send is non-fatal — the grant is already
// committed above. The CLI runs outside Next, so it sends inline HTML directly
// rather than importing the server-only email.service.
const resendApiKey = envVars.RESEND_API_KEY;
const fromEmail = envVars.RESEND_FROM_EMAIL;

if (!resendApiKey || !fromEmail || !approvedTo) {
  console.warn('Skipped approval email (missing RESEND_API_KEY / RESEND_FROM_EMAIL).');
  process.exit(0);
}

const html = `
  <div style="background-color:#0e0f0c;margin:0;padding:24px 0;font-family:Barlow,Arial,Helvetica,sans-serif;">
    <div style="margin:0 auto;padding:32px;max-width:480px;background-color:#161710;border:1px solid #2a2c22;border-radius:16px;">
      <div style="margin-bottom:24px;">
        <div style="font-family:'Barlow Condensed',Arial,sans-serif;font-size:30px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;color:#f0f0e8;line-height:1;">BALLRUNS</div>
        <div style="width:48px;height:3px;background-color:#c8f135;border-radius:2px;margin-top:10px;"></div>
      </div>
      <div style="font-family:'Barlow Condensed',Arial,sans-serif;font-size:24px;font-weight:800;text-transform:uppercase;letter-spacing:0.3px;color:#f0f0e8;margin:0 0 16px;">You're in, <span style="color:#c8f135;">${approvedName}</span>.</div>
      <p style="font-size:15px;line-height:24px;color:#8a8c7a;margin:0 0 14px;">Your account is approved to host. You can now create a run, set the format, and manage the queue and score from your phone.</p>
      <p style="font-size:15px;line-height:24px;color:#8a8c7a;margin:0 0 14px;">Head to BallRuns, create a run, and share the code to get players in.</p>
      <div style="border-top:1px solid #2a2c22;margin:24px 0;"></div>
      <div style="font-family:'Barlow Condensed',Arial,sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#4a4c3e;margin:0;">See you on the court.</div>
    </div>
  </div>
`;

try {
  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: approvedTo,
    subject: "You're approved to host on BallRuns",
    html,
  });
  if (error) {
    console.warn(`Approval email not sent: ${error.message}`);
  } else {
    console.log(`Approval email sent to ${approvedTo}`);
  }
} catch (err) {
  console.warn('Approval email not sent:', err);
}
