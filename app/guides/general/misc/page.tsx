import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import { GENERAL_GUIDE, findChapter } from '@/data/guides';

export default function MiscGuide() {
  const chapter = findChapter(GENERAL_GUIDE, 'misc')!;
  return (
    <GuidePage guide={GENERAL_GUIDE} chapter={chapter} description="A quick reference for the remaining utility commands.">

      <GuideSection title="Prefix">
        <p>Change the bot&apos;s command prefix for your server (max 8 characters):</p>
        <CodeBlock title="Fluxer" code="f!prefix !" />
        <p>Mention the bot at any time to find out the current prefix:</p>
        <CodeBlock title="Fluxer" code="@Functious" />
      </GuideSection>

      <GuideSection title="Language">
        <p>Change the language the bot replies in:</p>
        <CodeBlock title="Fluxer" code="f!language es_ES" />
        <p>Available languages: <code className="font-mono text-orange-light">en_EN</code>, <code className="font-mono text-orange-light">es_ES</code>, <code className="font-mono text-orange-light">pt_BR</code>, <code className="font-mono text-orange-light">ar_AR</code>, <code className="font-mono text-orange-light">pl_PL</code>, <code className="font-mono text-orange-light">sk_SK</code>.</p>
      </GuideSection>

      <GuideSection title="Ping">
        <p>Check the bot&apos;s gateway latency, database ping, and memory usage:</p>
        <CodeBlock title="Fluxer" code="f!ping" />
      </GuideSection>

      <GuideSection title="Info">
        <p>Show overall bot statistics -server count, uptime, and active polls and giveaways:</p>
        <CodeBlock title="Fluxer" code="f!info" />
      </GuideSection>
    </GuidePage>
  );
}
