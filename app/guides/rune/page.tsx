import type { Metadata } from 'next';
import Link from 'next/link';
import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { RUNE_GUIDE, findChapter, chapterHref } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Rune Guide',
  description:
    'Rune is the sandboxed scripting language behind Functious tags. Learn the basics, write your first tag, and browse the full reference.',
};

export default function RuneOverviewPage() {
  const chapter = findChapter(RUNE_GUIDE, '')!;

  return (
    <GuidePage
      guide={RUNE_GUIDE}
      chapter={chapter}
      description="Rune is the scripting language behind Functious tags. It is small on purpose, built for Fluxer, and fully sandboxed."
    >
      <GuideSection title="What is Rune?">
        <p>
          A tag is a small program a server can invoke any time. It can be a reusable message, a
          minigame, a lookup. Rune is what you write inside it. The language uses braces
          for blocks and JS-style parentheses, so if you have written any scripting
          language before, it will feel immediately familiar.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-semibold text-white">Braces for blocks.</span> Functions, loops,
            and conditionals group with <code className="font-mono text-orange-light">{'{ }'}</code>.
          </li>
          <li>
            <span className="font-semibold text-white">A full standard library.</span> Math,
            randomness, strings, lists, dicts, regex, and embeds are all built in.
          </li>
          <li>
            <span className="font-semibold text-white">Sandboxed by default.</span> A runaway loop
            can never take the bot down with it.
          </li>
        </ul>
      </GuideSection>

      <GuideSection title="Hello world">
        <p>
          Rune strings interpolate <code className="font-mono text-orange-light">[name]</code>{" "}
          directly, and a few globals are always in scope. Greeting a member is one line.
        </p>
        <CodeBlock title="rune" code={'say("hello, world")'} />
        <CodeBlock title="rune" code={'say("hello, [$user.display_name]!")'} />
      </GuideSection>

      <GuideSection title="Your first tag"> 
        <p>
          Tags are stored on the bot. Create one with{" "}
          <code className="font-mono text-orange-light">f!tags add</code>, giving it a name, a
          type, and the code that runs when someone uses it.
        </p>
        <CodeBlock title="Fluxer" code={'f!tags add welcome text say("hello, world")'} />
        <p>
          Now anyone can run it by name:
        </p>
        <CodeBlock title="Fluxer" code={'f!tags welcome'} />
        <p>
          Anything typed after the tag name is passed to the code as{" "}
          <code className="font-mono text-orange-light">args</code>.{" "}
          <code className="font-mono text-orange-light">args.0</code> is the first word,{" "}
          <code className="font-mono text-orange-light">args.1</code> is the second, and so on.
          The <a className="text-orange-light underline-offset-4 hover:underline" href="/guides/rune/globals">Context</a>{" "}
          chapter has the full details.
        </p>
        <p>
          So <code className="font-mono text-orange-light">f!tags greet rubik</code> gives the tag
          an <code className="font-mono text-orange-light">args.0</code> of{" "}
          <code className="font-mono text-orange-light">"rubik"</code>, and{" "}
          <code className="font-mono text-orange-light">[args.0]</code> in the code is replaced
          with it. A single tag turns into a command.
        </p>
        <CodeBlock
          title="Fluxer"
          code={'f!tags add greet text say("hi [args.0]!")\nf!tags greet rubik'}
        />
      </GuideSection>

      <GuideSection title="Where tags live">
        <p>
          You can build and manage tags with the{" "}
          <Link className="text-orange-light underline-offset-4 hover:underline" href="/commands#tags">
            f!tags
          </Link>{" "}
          command or visually from the{" "}
          <Link className="text-orange-light underline-offset-4 hover:underline" href="/dashboard">
            dashboard
          </Link>
          . A tag can be plain text or a rich embed, reused across your server the moment you
          save it. This guide covers the language itself. Either place runs the same Rune.
        </p>
      </GuideSection>

      <GuideSection title="Sandboxed by default">
        <p>
          Rune runs in a sandbox with hard limits, so even a tag gone wrong is a single clean
          error instead of a problem.
        </p>
        <Callout title="Limits">
          200,000 evaluation steps per tag, a call depth of 100, 3,900 characters of output, and
          up to 10 embeds. A runaway loop simply hits the step limit and stops.
        </Callout>
        <p>
          When a tag fails, Functious replies with a short embed naming the category of the error
          (parse vs. runtime). When it can, it also adds a code block with a caret pointing at
          the offending line.
        </p>
      </GuideSection>

      <GuideSection title="What&apos;s in this guide">
        <p>
          This guide walks through the language from the ground up. The chapters are short and
          each one builds on the last.
        </p>
        <ul className="list-none space-y-3">
          {RUNE_GUIDE.chapters.map((item) => (
            <li key={item.slug || 'overview'}>
              <Link
                href={chapterHref(RUNE_GUIDE, item)}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#140b08] px-4 py-3 transition-colors hover:border-orange/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                <span className="font-mono text-xs text-white/35">{String(RUNE_GUIDE.chapters.indexOf(item) + 1).padStart(2, '0')}</span>
                <span>
                  <span className="block text-sm font-semibold text-white transition-colors group-hover:text-orange-light">
                    {item.title}
                  </span>
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