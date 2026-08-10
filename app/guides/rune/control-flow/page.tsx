import type { Metadata } from 'next';
import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import { RUNE_GUIDE, findChapter } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Control Flow | Rune Guide',
  description:
    'Conditionals, loops, break, continue, stop, and functions in the Rune tag language.',
};

export default function RuneControlFlowPage() {
  const chapter = findChapter(RUNE_GUIDE, 'control-flow')!;

  return (
    <GuidePage
      guide={RUNE_GUIDE}
      chapter={chapter}
      description="Conditionals, every kind of loop, and functions."
    >
      <GuideSection title="Conditionals">
        <p>
          <code className="font-mono text-orange-light">if</code>,{" "}
          <code className="font-mono text-orange-light">elif</code>, and{" "}
          <code className="font-mono text-orange-light">else</code> work exactly as you would
          expect, with braces for the blocks.
        </p>
        <CodeBlock
          title="rune"
          code={'score = 50\n\nif (score >= 90) {\n  say("A")\n} elif (score >= 80) {\n  say("B")\n} else {\n  say("C")\n}'}
        />
      </GuideSection>

      <GuideSection title="while loops">
        <p>
          Loop while a condition holds. Combined with a counter and the increment operator, this
          is the classic countdown engine.
        </p>
        <CodeBlock
          title="rune"
          code={'i = 0\nwhile (i < 5) {\n  say(i)\n  i += 1\n}'}
        />
      </GuideSection>

      <GuideSection title="for loops">
        <p>Three flavours: a classic counter, iterating a list or dict, and counting over a range.</p>
        <CodeBlock
          title="rune"
          code={'dict = [1, 2, 3]\n\nfor (i = 0; i < 5; i++) {\n  say(i)\n}\n\nitems = ["a", "b", "c"]\nfor (item in items) {\n  say(item)\n}\n\nfor (key in dict) {\n  say(key + "=" + dict[key])\n}\n\nfor (i in 5) {\n  say(i)\n}'}
        />
      </GuideSection>

      <GuideSection title="break, continue, and stop">
        <p>
          <code className="font-mono text-orange-light">break</code> and{" "}
          <code className="font-mono text-orange-light">continue</code> work inside loops.{" "}
          <code className="font-mono text-orange-light">stop</code> halts the whole tag
          immediately. Anything already sent with{" "}
          <code className="font-mono text-orange-light">say</code> is still delivered, and
          everything after is skipped.
        </p>
        <CodeBlock
          title="rune"
          code={'for (i in 10) {\n  if (i == 3) { continue }\n  if (i == 7) { break }\n  say(i)\n}'}
        />
        <CodeBlock
          title="rune"
          code={'# add an arg for this to work\n\nif (args.0 == null) {\n  say("missing an argument")\n  stop\n}\nsay("thanks for " + args.0)'}
        />
        <p>
          A <code className="font-mono text-orange-light">switch</code> is also available for
          dispatching on a value when a chain of elifs starts to drag.
        </p>
      </GuideSection>

      <GuideSection title="Functions">
        <p>
          Named and anonymous. A function body always uses braces. Define once, call anywhere.
        </p>
        <CodeBlock
          title="rune"
          code={'fn add(a, b) {\n  return a + b\n}\nsay(add(2, 3))'}
        />
        <p>
          Functions are first-class, so you can hand them to the list builtins for a quick{" "}
          <code className="font-mono text-orange-light">map</code>,{" "}
          <code className="font-mono text-orange-light">filter</code>, or{" "}
          <code className="font-mono text-orange-light">reduce</code>.
        </p>
        <CodeBlock
          title="rune"
          code={'nums = [1, 2, 3]\ndoubled = nums.map(fn(x) { return x * 2 })\nsay(doubled)   # [2, 4, 6]'}
        />
        <p>
          The full set of list combinators lives in the{" "}
          <a className="text-orange-light underline-offset-4 hover:underline" href="/guides/rune/builtins">Builtins</a>{" "}
          chapter.
        </p>
      </GuideSection>
    </GuidePage>
  );
}