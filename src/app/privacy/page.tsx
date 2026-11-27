import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/ui/legal-page";

const CONTACT_EMAIL = "support@pickleruns.website";

export const metadata: Metadata = {
  title: "Privacy Policy | PickleRuns",
  description: "How PickleRuns collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="November 27, 2026" otherHref="/terms" otherLabel="Terms of Service">
      <LegalSection heading="Who we are">
        <p>
          PickleRuns is a pickup pickleball court queue and scoring web app, run by an individual developer in the
          Philippines. This policy explains what we collect and how we use it. Questions can be sent to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection heading="Information we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>Account data: your email address, display name, and an optional profile photo.</li>
          <li>Google sign-in: if you sign in with Google, we receive your Google profile name and email.</li>
          <li>Guests: you can join a run without an account by entering only a display name.</li>
          <li>
            Hosts: a display name submitted with a host request, and an optional payment QR image (for example GCash)
            that you upload for your run.
          </li>
          <li>
            Run data: session code, run name or location, queue entries, games, scores, court assignments, and history.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Run data is visible to code holders">
        <p>
          Anyone who has a run&apos;s session code can see that run, including the live scoreboard, queue, and display
          names. Please do not put anything sensitive in your display name.
        </p>
      </LegalSection>

      <LegalSection heading="How we use your information">
        <p>
          We use your information to sign you in, run queues and scoring, show a host&apos;s payment QR to players in
          that run, send transactional emails such as email confirmation, and keep the service working and secure.
        </p>
      </LegalSection>

      <LegalSection heading="Service providers">
        <p>We rely on these providers to operate PickleRuns:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Supabase: database, authentication, file storage, and realtime updates (Singapore region).</li>
          <li>Vercel: web hosting (Singapore functions).</li>
          <li>Resend: transactional email.</li>
          <li>Google: sign-in.</li>
        </ul>
        <p>We do not sell your data, show ads, or use analytics or tracking cookies.</p>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>We use only essential cookies needed to keep you signed in and secure your session.</p>
      </LegalSection>

      <LegalSection heading="Retention and deletion">
        <p>
          We keep your data while your account exists. To delete your account and data, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>{" "}
          and we will remove it on request.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>PickleRuns is not directed to children under 13, and we do not knowingly collect their information.</p>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>
          We may update this policy from time to time. When we do, the &quot;Last updated&quot; date at the top will
          change.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
