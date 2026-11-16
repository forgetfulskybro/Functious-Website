import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for the Functious Fluxer bot and dashboard - what data we collect, how we use it, and how to view or delete it.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-white/40">Last Updated: November 15, 2026</p>
      </header>

      <div className="prose prose-invert prose-orange max-w-none space-y-8 text-white/75 leading-relaxed">

        <p>
          This Privacy Policy describes how the Fluxer bot (referred to as <strong className="text-white">Functious</strong>) and
          its dashboard collect, use, store, and delete data. Functious operates exclusively on the Fluxer platform.
          This policy applies <em>only</em> to data handled by Functious. Fluxer itself has its own separate privacy policy.
        </p>
        <p>By using Functious, you agree to the practices outlined below.</p>

        <Section title="1. Data We Collect">
          <p>
            We collect the data needed to operate the features you use. This is feature-specific data, not a general
            archive of your messages. We do not keep a general message history or store the arguments you type after a command.
          </p>
          <p className="text-white/50 text-sm italic">
            We do not intentionally store email addresses, IP addresses, passwords, payment information, or advertising
            identifiers in the bot database. We do not use advertising trackers or tracking pixels.
          </p>

          <p>
            <strong className="text-white">Account and preferences.</strong> Your Fluxer user ID, timezone, birthday day and month,
            optional age, birthday announcement preference, the communities where birthday announcements are enabled or disabled,
            and your translation roles, credited languages, and requested languages. We also store a community&apos;s birthday
            blacklist so the bot can respect opt-outs.
          </p>

          <p>
            <strong className="text-white">Reminders and watched messages.</strong> Reminder text, delivery time, delivery type,
            creation time, and the relevant channel or source message ID. Reaction reminders also store the community and channel
            IDs and names, the source message and author IDs, a short sample and normalized fingerprint of the message you chose
            to watch, attachment filenames, your reminder message, the requested duration, language, and a match count.
          </p>

          <p>
            <strong className="text-white">Community configuration and roles.</strong> Community IDs and settings, including tags,
            stickies, scheduled messages, role and channel configuration, and temporary-channel setup. Feature records include
            the creator or owner user ID, tag/sticky/scheduled message content or embed data, temporary-channel owner and channel
            IDs, timezone entries, birthday opt-outs, and sticky-role or timed-role assignments.
          </p>

          <p>
            <strong className="text-white">Feature records.</strong>
          </p>
          <ul className="mt-3 space-y-2 pl-5 list-disc">
            <li><strong className="text-white">Polls:</strong> the owner, question and options, voter user IDs, public avatar URLs, vote choices, and counts.</li>
            <li><strong className="text-white">Giveaways:</strong> the owner, prize and requirements, entrant user IDs, winners, and related configuration.</li>
            <li><strong className="text-white">Events:</strong> the host ID, title, description, location, times, reminder text, and RSVP responses.</li>
            <li><strong className="text-white">Forms:</strong> the creator ID, questions, applicant and reviewer IDs, submitted answers, review status, and review reason.</li>
            <li><strong className="text-white">Translations:</strong> translation text, previous values, notes, status, timestamps, and the user ID credited for an edit.</li>
          </ul>

          <p>
            <strong className="text-white">Audit and command-usage events.</strong> We send audit and usage events to our Vanta
            service. These events can include your user ID, username and discriminator, community ID, the command name, and
            community setting changes with their previous and new values. Some audit values can contain content you configured,
            such as a tag description or reminder text. We do not send command arguments.
          </p>

          <p>
            <strong className="text-white">Website session.</strong> When you sign in to the dashboard, we set one essential
            HTTP-only cookie named <code className="text-orange text-sm bg-white/5 px-1.5 py-0.5 rounded">functious_session</code>.
            It contains your Fluxer profile and the access token needed to view your communities, expires after 7 days, and is
            removed when you log out.
          </p>
        </Section>

        <Section title="2. How We Use the Data">
          <ul className="space-y-1 pl-5 list-disc">
            <li>To run reminders, polls, giveaways, events, forms, tags, stickies, scheduling, translations, birthdays, and temporary channels.</li>
            <li>To remember your preferences and apply community-specific settings and role assignments.</li>
            <li>To let authorized community managers review form submissions and configuration changes.</li>
            <li>To maintain audit logs, understand which commands are used, troubleshoot errors, prevent abuse, and improve Functious.</li>
            <li>To authenticate you to the dashboard and show the data associated with your account.</li>
          </ul>
          <p className="text-white/50 text-sm italic">
            We do not sell your data, use it for advertising, or build advertising profiles from it.
          </p>
        </Section>

        <Section title="3. Data Retention & Deletion">
          <p>
            Retention depends on the feature. Some data is removed automatically, but not every record is deleted as soon as
            the related poll, giveaway, or event ends.
          </p>
          <ul className="space-y-1 pl-5 list-disc">
            <li><strong className="text-white">Reminders</strong> are removed after the delivery attempt.</li>
            <li><strong className="text-white">Reaction reminders</strong> remain until you remove them, their channel or community disappears, or your data is deleted.</li>
            <li><strong className="text-white">Polls and giveaways</strong> are kept after they end, including voter or entrant IDs and winner records, until the record is deleted or your related data is deleted. Ending a poll or giveaway does not by itself purge those records.</li>
            <li><strong className="text-white">Events and forms</strong> remain until the event, form, or submission is deleted or withdrawn. An event ending does not delete its record or RSVPs.</li>
            <li><strong className="text-white">Translation text</strong> remains part of the bot&apos;s localization. If you delete your data, your attribution and notes are removed, but the translated text is not erased.</li>
            <li><strong className="text-white">Community data</strong> is kept while Functious remains in the community and is cleaned up by scheduled maintenance after the bot is removed.</li>
            <li><strong className="text-white">Temporary-channel records</strong> are removed when the temporary channel is cleaned up.</li>
            <li><strong className="text-white">Account records</strong> such as your user ID, timezone, birthday, reminders, and reaction reminders remain until you use the delete-everything option or ask us to remove them.</li>
            <li><strong className="text-white">Vanta audit and usage events</strong> are retained by the Vanta service. The dashboard displays the last 90 days. They are not removed by the bot&apos;s self-service deletion; contact us to request their removal.</li>
            <li><strong className="text-white">Website session cookie</strong> expires after 7 days or when you log out.</li>
            <li><strong className="text-white">Privacy data cache</strong> may keep a copy of your data in bot memory for up to 20 minutes.</li>
          </ul>
        </Section>

        <Section title="4. Your Choices & Right to Delete">
          <p>
            Signed-in users can open <a href="/profile" className="text-orange hover:underline">Profile &rarr; Data &amp; privacy</a>{' '}
            to view and download the data connected to their user ID in the bot database and queues.
          </p>
          <ul className="space-y-1 pl-5 list-disc">
            <li><strong className="text-white">Selective deletion</strong> can remove individual polls, giveaways, events, RSVPs, forms, form submissions, translation credits and notes, and community references. Removing a record you own can also remove other users&apos; participation in it.</li>
            <li><strong className="text-white">Delete everything</strong> requires an explicit acknowledgement. It removes your user record, reminders, reaction reminders, birthday and timezone data, your votes and giveaway entries, polls and giveaways you own, events you host, your RSVPs, forms and submissions you own, your form reviewer ID, and your translation credits, notes, and community references.</li>
            <li><strong className="text-white">What delete everything does not remove:</strong> translated text published in the bot&apos;s localization, most messages already sent to Fluxer (feature messages may be removed with their records), Vanta audit or command-usage events, and the browser session cookie. Log out to clear the cookie.</li>
            <li><strong className="text-white">Account-level records</strong> that are not offered as individual checkboxes, such as reminders and birthday details, can be removed by using delete everything.</li>
          </ul>
          <p>
            Because Vanta events are held outside the bot database, self-service deletion does not erase them. Contact the
            developer through the official support community to request removal of audit or command-usage events.
          </p>
        </Section>

        <Section title="5. Data Storage & Security">
          <p>
            The bot database is hosted on the developer&apos;s home-lab hardware. Website sessions are stored in a signed,
            HTTP-only cookie rather than a server-side session database. Vanta and Fluxer are external services, as described below.
          </p>
        </Section>

        <Section title="6. Children's Privacy">
          <p>
            Functious is not directed at children under 13. If you are under 13, please do not use Functious.
            We do not knowingly collect data from children under 13.
          </p>
        </Section>

        <Section title="7. Third-Party Services">
          <p>
            We do not sell or rent data. We use service providers only to operate Functious:
          </p>
          <ul className="space-y-1 pl-5 list-disc">
            <li><strong className="text-white">Fluxer</strong> provides authentication, profiles, communities, messages, and voice features through its API. Fluxer handles that data under its own privacy policy.</li>
            <li><strong className="text-white">Vanta</strong> receives the audit and command-usage events described above, including user and community identifiers, username and discriminator, command names, and configuration values. It powers the dashboard audit log and usage analytics. Vanta events are not covered by the bot&apos;s self-service deletion.</li>
            <li><strong className="text-white">Sentry</strong> may receive error diagnostics when error monitoring is enabled. We do not intentionally attach message content to those reports.</li>
          </ul>
          <p>
            We do not allow these providers to use your data for their own advertising or sell it.
          </p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>
            We may update this Privacy Policy occasionally. The &quot;Last Updated&quot; date at the top will reflect changes,
            and major updates will be announced in Functious&apos; official support community.
          </p>
        </Section>

        <Section title="9. Questions or Concerns">
          <p>
            Contact the developer through the official support community (link available in Functious&apos; bio or the{' '}
            <code className="text-orange text-sm bg-white/5 px-1.5 py-0.5 rounded">f!info</code> command). It can also be found under the{' '}
            <code className="text-orange text-sm bg-white/5 px-1.5 py-0.5 rounded">Support</code> dropdown.
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
