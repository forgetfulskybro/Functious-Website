import Link from 'next/link';
import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import ReactionRolesDemo from '@/components/home/ReactionRolesDemo';
import { REACTION_ROLES_GUIDE, findChapter, chapterHref } from '@/data/guides';

export default function ReactionRolesOverview() {
  const chapter = findChapter(REACTION_ROLES_GUIDE, '')!;
  return (
    <GuidePage guide={REACTION_ROLES_GUIDE} chapter={chapter} description="Reaction roles let your members self-assign roles by reacting to a message. No setup beyond the initial panel -it runs automatically from there.">
      <GuideSection title="How it works">
        <p>
          You create a panel message that lists roles next to emojis. When a member reacts with
          an emoji, the bot adds the matching role. Removing the reaction removes the role.
          The bot can optionally DM members when a role is added or removed.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li><span className="font-semibold text-white">Up to 12 panels</span> per server, each holding up to 30 role–emoji pairs.</li>
          <li><span className="font-semibold text-white">Two message types:</span> plain content or a rich embed.</li>
          <li><span className="font-semibold text-white">Exclusive mode</span> limits a panel to one role per user at a time.</li>
        </ul>
      </GuideSection>

      <GuideSection title="Permission required">
        <Callout title="Manage Guild">
          The <code className="font-mono text-orange-light">f!roles</code> command requires the
          Manage Guild permission. Members can react freely without any special permission.
        </Callout>
      </GuideSection>

      <GuideSection title="Quick start">
        <p>Run the create command, write your message using <code className="font-mono text-orange-light">{'{role:RoleName}'}</code> placeholders, then react to the bot&apos;s copy in the order your roles appear.</p>
        <CodeBlock title="Fluxer" code="f!roles create" />
        <p>The bot posts a setup prompt. Send a message like this:</p>
        <CodeBlock title="Your message" code={`Color Roles:\n{role:Blue}\n{role:Red}\n{role:Purple}`} />
        <p>
          Then react to the bot&apos;s copy of your message with one emoji per role, in the same
          order. React ✅ when done.
        </p>
      </GuideSection>

      <ReactionRolesDemo />


      <GuideSection title="Chapters in this guide">
        <ul className="list-none space-y-3">
          {REACTION_ROLES_GUIDE.chapters.map((item) => (
            <li key={item.slug || 'overview'}>
              <Link
                href={chapterHref(REACTION_ROLES_GUIDE, item)}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#140b08] px-4 py-3 transition-colors hover:border-orange/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                <span className="font-mono text-xs text-white/35">{String(REACTION_ROLES_GUIDE.chapters.indexOf(item) + 1).padStart(2, '0')}</span>
                <span>
                  <span className="block text-sm font-semibold text-white transition-colors group-hover:text-orange-light">{item.title}</span>
                  <span className="block text-xs text-white/40">{item.short}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </GuideSection>
    </GuidePage>
  );
}
