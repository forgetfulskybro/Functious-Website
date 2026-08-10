import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for the Functious Fluxer bot - what data we collect, how we use it, and your rights.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-white/40">Last Updated: March 21, 2026</p>
      </header>

      <div className="prose prose-invert prose-orange max-w-none space-y-8 text-white/75 leading-relaxed">

        <p>
          This Privacy Policy describes how the Fluxer bot (referred to as <strong className="text-white">Functious</strong>) collects,
          uses, stores, and deletes data. Functious operates exclusively on the Fluxer platform.
          This policy applies <em>only</em> to data handled by Functious. Fluxer itself has its own separate privacy policy.
        </p>
        <p>By using Functious, you agree to the practices outlined below.</p>

        <Section title="1. Data We Collect">
          <p>
            We only collect the <strong className="text-white">absolute minimum</strong> data required for Functious' features to function.
          </p>
          <p className="text-white/50 text-sm italic">
            No messages, usernames, emails, IP addresses, analytics data, or any other personal information is stored.
            We do not use cookies, tracking pixels, or any form of user tracking.
          </p>
          <ul className="mt-3 space-y-2 pl-5 list-disc">
            <li><strong className="text-white">User IDs</strong> - only for giveaway entries, poll votes (with public avatar URL), and timezone settings you choose to set.</li>
            <li><strong className="text-white">Guild IDs</strong> - stored for every server Functious is in, to remember per-server settings.</li>
            <li><strong className="text-white">Temporary Voice Channels</strong> - User IDs of people in bot-created voice channels only.</li>
          </ul>
        </Section>

        <Section title="2. How We Use the Data">
          <ul className="space-y-1 pl-5 list-disc">
            <li>Giveaway User IDs → to track entries and pick winners.</li>
            <li>Poll User IDs + avatar URLs → to display accurate vote results.</li>
            <li>Timezone User IDs → to convert times correctly between users.</li>
            <li>Guild IDs → to apply server-specific settings.</li>
            <li>Voice User IDs → to manage temporary voice channel lifecycle.</li>
          </ul>
        </Section>

        <Section title="3. Data Retention & Automatic Deletion">
          <ul className="space-y-1 pl-5 list-disc">
            <li><strong className="text-white">Giveaway User IDs</strong> → removed the moment the giveaway ends.</li>
            <li><strong className="text-white">Poll User IDs & avatar URLs</strong> → removed the moment the poll ends.</li>
            <li><strong className="text-white">Temporary Voice Channel User IDs</strong> → removed the instant you leave the channel.</li>
            <li><strong className="text-white">Guild settings</strong> → kept only while Functious remains in the server.</li>
          </ul>
        </Section>

        <Section title="4. Your Right to Delete Your Data">
          <p>
            <strong className="text-white">Timezone data</strong> can be removed at any time using Functious' dedicated removal command
            (shown in the help menu). All other data is automatically deleted on schedule - no manual action required.
          </p>
        </Section>

        <Section title="5. Data Storage & Security">
          <p>
            Data is stored in a secure database hosted locally on the developer's home lab hardware.
            Nothing is stored externally - no cloud providers, no third-party servers.
            We use industry-standard security practices, but no system is 100% secure.
          </p>
        </Section>

        <Section title="6. Children's Privacy">
          <p>
            Functious is not directed at children under 13. If you are under 13, please do not use Functious.
            We do not knowingly collect any data from children under 13.
          </p>
        </Section>

        <Section title="7. No Sharing with Third Parties">
          <p>
            We do not sell, rent, or share any data with anyone. Functious does not send data to external services
            except for what Fluxer's own API requires to operate.
          </p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>
            We may update this Privacy Policy occasionally. The "Last Updated" date at the top will reflect any changes,
            and major updates will be announced in Functious' official support server.
          </p>
        </Section>

        <Section title="9. Questions or Concerns">
          <p>
            Contact the developer through the official support server (link available in Functious' bio or{' '}
            <code className="text-orange text-sm bg-white/5 px-1.5 py-0.5 rounded">f!info</code> command).
          </p>
        </Section>

        <p className="border-t border-white/10 pt-6 text-sm text-white/40">
          By using Functious, you acknowledge that you have read and understood this Privacy Policy.
        </p>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
