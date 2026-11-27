import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/ui/legal-page";

const CONTACT_EMAIL = "support@pickleruns.website";

export const metadata: Metadata = {
  title: "Terms of Service | PickleRuns",
  description: "The terms that apply when you use PickleRuns.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="November 27, 2026" otherHref="/privacy" otherLabel="Privacy Policy">
      <LegalSection heading="Agreement">
        <p>
          By using PickleRuns, a pickup pickleball court queue and scoring app, you agree to these terms. If you do not
          agree, please do not use the service.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>When using PickleRuns, you agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>abuse, spam, or flood the service, including queues and scoring;</li>
          <li>impersonate another person;</li>
          <li>upload or share illegal content.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Host responsibilities">
        <p>
          Hosts are responsible for how they run their sessions and how they collect and use payments. PickleRuns does
          not process payments. We only display the host&apos;s QR image, and any payment is between the host and the
          player.
        </p>
      </LegalSection>

      <LegalSection heading="Your content">
        <p>
          You are responsible for the display names, images, and other content you provide. Run data is visible to
          anyone with the run&apos;s session code.
        </p>
      </LegalSection>

      <LegalSection heading="Service provided as is">
        <p>
          PickleRuns is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We do
          not guarantee that the service will be uninterrupted. Live scoring and queues may be interrupted.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, PickleRuns and its operator are not liable for any indirect,
          incidental, or consequential damages, or for lost data, arising from your use of the service.
        </p>
      </LegalSection>

      <LegalSection heading="Suspension and removal">
        <p>We may suspend accounts or remove content that breaks these terms or harms the service or other users.</p>
      </LegalSection>

      <LegalSection heading="Governing law and changes">
        <p>
          These terms are governed by the laws of the Philippines. We may update them from time to time, and the
          &quot;Last updated&quot; date at the top will change. Continuing to use PickleRuns means you accept the
          updated terms.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms can be sent to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
