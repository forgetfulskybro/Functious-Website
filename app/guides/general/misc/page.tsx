import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import { GENERAL_GUIDE, findChapter } from '@/data/guides';

export default function MiscGuide() {
  const chapter = findChapter(GENERAL_GUIDE, 'misc')!;
  return (
    <GuidePage guide={GENERAL_GUIDE} chapter={chapter} description="A quick reference for the remaining utility commands.">

      <GuideSection title="Prefix">
        <p>Change the bot&apos;s command prefix for your community (max 8 characters):</p>
        <CodeBlock title="Fluxer" code="f!prefix set !" />
        <p>Mention the bot at any time to find out the current prefix:</p>
        <CodeBlock title="Fluxer" code="@Functious" />
      </GuideSection>

      <GuideSection title="Language">
        <p>Change the language the bot replies in:</p>
        <CodeBlock title="Fluxer" code="f!language es" />
        <p>
          You can pass the full code, the short code, or the language name. Both{' '}
          <code className="font-mono text-orange-light">f!language es</code>,{' '}
          <code className="font-mono text-orange-light">f!language es_ES</code>, and{' '}
          <code className="font-mono text-orange-light">f!language spanish</code> all work.
        </p>
        <p>
          Available languages:{' '}
          <code className="font-mono text-orange-light">en_EN</code> (english),{' '}
          <code className="font-mono text-orange-light">es_ES</code> (spanish),{' '}
          <code className="font-mono text-orange-light">pt_BR</code> (portuguese),{' '}
          <code className="font-mono text-orange-light">fr_FR</code> (french),{' '}
          <code className="font-mono text-orange-light">de_DE</code> (german),{' '}
          <code className="font-mono text-orange-light">pl_PL</code> (polish),{' '}
          <code className="font-mono text-orange-light">ar_AR</code> (arabic), and{' '}
          <code className="font-mono text-orange-light">tr_TR</code> (turkish).
        </p>
      </GuideSection>

      <GuideSection title="Ping">
        <p>Check the bot&apos;s gateway latency, database ping, and memory usage:</p>
        <CodeBlock title="Fluxer" code="f!ping" />
      </GuideSection>

      <GuideSection title="Info">
        <p>Show overall bot statistics -community count, uptime, and active polls and giveaways:</p>
        <CodeBlock title="Fluxer" code="f!info" />
      </GuideSection>
    </GuidePage>
  );
}
