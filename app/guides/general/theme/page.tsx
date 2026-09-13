import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { GENERAL_GUIDE, findChapter } from '@/data/guides';

export default function ThemeGuide() {
  const chapter = findChapter(GENERAL_GUIDE, 'theme')!;
  return (
    <GuidePage guide={GENERAL_GUIDE} chapter={chapter} description="Change the bot's embed color, avatar, and banner for your server.">

      <GuideSection title="How it works">
        <p>
          Running <code className="font-mono text-orange-light mr-1">f!theme</code> recolors the bot&apos;s avatar and
          banner using your chosen color, then saves it as the default embed color for all bot
          replies in your server.
        </p>
        <Callout title="Requires Manage Guild">
          Only members with Manage Guild can change the theme. The change is per-server -other
          servers are not affected.
        </Callout>
      </GuideSection>

      <GuideSection title="Setting a color">
        <p>You can use almost any color format:</p>
        <CodeBlock title="Hex" code="f!theme #FF4500" />
        <CodeBlock title="Named color" code="f!theme coral" />
        <CodeBlock title="RGB" code="f!theme rgb(255, 69, 0)" />
        <CodeBlock title="HSL" code="f!theme hsl(16, 100%, 50%)" />
        <p>3-digit hex shorthand also works:</p>
        <CodeBlock title="Short hex" code="f!theme #F45" />
      </GuideSection>

      <GuideSection title="Resetting to default">
        <p>
          Restore the original Functious orange avatar, banner, and embed color:
        </p>
        <CodeBlock title="Fluxer" code="f!theme default" />
      </GuideSection>

      <GuideSection title="What gets changed">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>The bot&apos;s <span className="font-semibold text-white">profile picture</span> (recolored to match your theme).</li>
          <li>The bot&apos;s <span className="font-semibold text-white">banner</span> (recolored to match your theme).</li>
          <li>The <span className="font-semibold text-white">left-side accent color</span> on all bot embeds in your server.</li>
        </ul>
        <Callout>
          The bot&apos;s global profile is shared across all servers. Each server stores its own theme
          color, but the avatar and banner update in Fluxer&apos;s server profile -visible only in
          your server&apos;s member list and profile pop-ups.
        </Callout>
      </GuideSection>
    </GuidePage>
  );
}
