import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { GENERAL_GUIDE, findChapter } from '@/data/guides';

export default function AutorolesGuide() {
  const chapter = findChapter(GENERAL_GUIDE, 'autoroles')!;
  return (
    <GuidePage
      guide={GENERAL_GUIDE}
      chapter={chapter}
      description="Automatically assign roles when members join, save roles when they leave, or grant roles after a time period."
    >
      <GuideSection title="Join roles">
        <p>
          Join roles are added to every member the moment they join the server. Add one or more
          role names (or mentions) after the subcommand:
        </p>
        <CodeBlock title="Fluxer - add" code="f!autoroles joinroles add Member, Newcomer" />
        <CodeBlock title="Fluxer - remove" code="f!autoroles joinroles remove Member" />
        <Callout>
          You can add up to 20 join roles per server. Duplicates are ignored automatically.
        </Callout>
      </GuideSection>

      <GuideSection title="Sticky roles">
        <p>
          When sticky roles are enabled, the bot records each member's roles when they leave.
          If they rejoin, those roles are restored automatically.
        </p>
        <CodeBlock title="Fluxer - toggle on/off" code="f!autoroles stickyroles" />
        <p>
          You can also whitelist specific roles to stick instead of all of them:
        </p>
        <CodeBlock title="Fluxer - add sticky role" code="f!autoroles stickyroles add Verified" />
        <CodeBlock title="Fluxer - remove sticky role" code="f!autoroles stickyroles remove Verified" />
      </GuideSection>

      <GuideSection title="Timed roles">
        <p>
          Timed roles are assigned to a member after they have been in the server for a set
          amount of time. Use the <code className="font-mono text-orange-light">{'{time:}'}</code> option to set the delay:
        </p>
        <CodeBlock title="Fluxer - add timed role" code="f!autoroles timedroles add Veteran {time:30d}" />
        <CodeBlock title="Fluxer - remove timed role" code="f!autoroles timedroles remove Veteran" />
        <p>
          Time formats: <code className="font-mono text-orange-light">30m</code>,{' '}
          <code className="font-mono text-orange-light">12h</code>,{' '}
          <code className="font-mono text-orange-light">7d</code>,{' '}
          <code className="font-mono text-orange-light">1d12h</code>.
        </p>
      </GuideSection>

      <GuideSection title="Viewing current autorole settings">
        <CodeBlock title="Fluxer" code="f!autoroles view" />
      </GuideSection>
    </GuidePage>
  );
}
