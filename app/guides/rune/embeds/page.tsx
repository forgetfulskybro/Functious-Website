import type { Metadata } from 'next';
import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import ProseTable from '@/components/guide/ProseTable';
import Callout from '@/components/guide/Callout';
import { RUNE_GUIDE, findChapter } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Embeds | Rune Guide',
  description:
    'Build rich Discord embeds in Rune with the embed() builder and chainable setters.',
};

export default function RuneEmbedsPage() {
  const chapter = findChapter(RUNE_GUIDE, 'embeds')!;

  return (
    <GuidePage
      guide={RUNE_GUIDE}
      chapter={chapter}
      description="Build rich Discord embeds with the embed() builder and chainable setters."
    >
      <GuideSection title="Building an embed">
        <p>
          Build an embed with <code className="font-mono text-orange-light">embed()</code> and
          chain setters. Pass the finished embed to{" "}
          <code className="font-mono text-orange-light">say(...)</code> to send it.
        </p>
        <CodeBlock
          title="rune"
          code={'e = embed()\ne.title("Tag bot")\ne.color("blurple")\ne.description("hello " + $user.display_name)\ne.field("members", $guild.member_count, true)\ne.footer("powered by fluxer.js")\ne.timestamp(now())\nsay(e)'}
        />
        <p>
          Every setter returns the embed, so the whole thing fits on one line. That includes the{" "}
          <code className="font-mono text-orange-light">set*</code> versions like{" "}
          <code className="font-mono text-orange-light">setTitle</code> and{" "}
          <code className="font-mono text-orange-light">setDescription</code>.
        </p>
        <CodeBlock
          title="rune"
          code={'say(embed().title("Hi").description("Welcome").color("#5865f2"))'}
        />
      </GuideSection>

      <GuideSection title="Setters">
        <ProseTable
          headers={['method', 'does']}
          rows={[
            ['title(text)', 'the embed title'],
            ['description(text)', 'the main text'],
            ['color(value)', 'a color'],
            ['url(link)', 'a link for the title'],
            ['author(name, url, iconUrl)', 'the author line'],
            ['thumbnail(url)', 'the small image top right'],
            ['image(url)', 'the large image'],
            ['footer(text, iconUrl)', 'the footer'],
            ['timestamp(value)', 'a timestamp'],
            ['field(name, value, inline)', 'adds a field'],
            ['fields(...) / addFields(...)', 'adds fields'],
          ]}
        />
      </GuideSection>

      <GuideSection title="Colors">
        <p>
          Pass a number, a <code className="font-mono text-orange-light">#RRGGBB</code> string,
          or a named color.
        </p>
        <CodeBlock
          title="rune"
          code={'embed().color(0xFF0000)\nembed().color("#FF0000")\nembed().color("red")\nembed().color("blurple")'}
        />
      </GuideSection>

      <GuideSection title="Limits">
        <p>
          Fields are capped at 25, names at 256 characters, and values at 1024 characters. The
          whole embed follows the usual Fluxer limits.
        </p>
        <Callout title="Embed count">
          At most 10 embeds can be sent by a single tag. See the{" "}
          <a className="text-orange-light underline-offset-4 hover:underline" href="/guides/rune">Overview</a>{" "}
          for the full sandbox limits.
        </Callout>
      </GuideSection>
    </GuidePage>
  );
}
