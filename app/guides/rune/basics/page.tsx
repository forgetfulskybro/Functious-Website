import type { Metadata } from 'next';
import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import { RUNE_GUIDE, findChapter } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Basics | Rune Guide',
  description:
    'Comments, variables, values, strings with interpolation, and every operator in the Rune language.',
};

export default function RuneBasicsPage() {
  const chapter = findChapter(RUNE_GUIDE, 'basics')!;

  return (
    <GuidePage
      guide={RUNE_GUIDE}
      chapter={chapter}
      description="Comments, variables, values, strings, and the operators you will use every day."
    >
      <GuideSection title="Comments">
        <p>Three ways to leave notes in a tag. Comments are skipped by the parser.</p>
        <CodeBlock
          title="rune"
          code={'# a line comment\n// also a line comment\n/* a block comment */'}
        />
      </GuideSection>

      <GuideSection title="Variables">
        <p>
          Declare with <code className="font-mono text-orange-light">let</code>,{" "}
          <code className="font-mono text-orange-light">const</code>, or{" "}
          <code className="font-mono text-orange-light">var</code>. You can also skip the keyword
          and let Rune infer the variable. The assignment operators behave as expected.
        </p>
        <CodeBlock
          title="rune"
          code={'let name = "rubik"\nconst answer = 42\ntotal = 0\ntotal += 5\n\nsay([name], `${answer}`, total)'}
        />
      </GuideSection>

      <GuideSection title="Values">
        <p>
          Rune has the usual value types: numbers, strings, booleans,{" "}
          <code className="font-mono text-orange-light">null</code>,{" "}
          <code className="font-mono text-orange-light">undefined</code>, arrays, and
          dictionaries.
        </p>
        <CodeBlock
          title="rune"
          code={'n = 3.14\ns = "text"\nb = true\narr = [1, 2, 3]\ndict = { name: "rubik", tags: ["flux", "tag"] }\n\nif(b && s === "text" || n === 3.14) {\n  say(embed().title(dict.name).description(join(dict.tags)))\n}'}
        />
        <p>
          Read any key on a dictionary or index into an array with dot notation or square
          brackets. Numbers work as dot keys too.
        </p>
        <CodeBlock
          title="rune"
          code={'d = { city: "seattle" }\nsay(d.city)\na = [10, 20]\nsay(a.0)       # 10\nsay(a[1])      # 20'}
        />
      </GuideSection>

      <GuideSection title="Strings and interpolation">
        <p>
          Use single or double quotes. Inside a string,{" "}
          <code className="font-mono text-orange-light">[name]</code> is replaced with the value
          of the variable <code className="font-mono text-orange-light">name</code>. The path can
          be as deep as you like.
        </p>
        <CodeBlock
          title="rune"
          code={`let d = {
  "city": "Marysville",
  "state": "Michigan"
}
            
let array = [1, 2, 3];
            
name = "rubik"
say("hello [name]")
say("in [d.city], [d.state]")
say("an array like [array] is left alone")`}
        />
        <p>
          Write <code className="font-mono text-orange-light">\[</code> for a literal opening
          bracket, and reach for backtick strings when you prefer{" "}
          <code className="font-mono text-orange-light">{"${...}"}</code> syntax.
        </p>
        <CodeBlock title="rune" code={'say(`hi ${name}`)'} />
      </GuideSection>

      <GuideSection title="Operators">
        <p>
          Arithmetic, comparison, logic, membership, and more are all built in.
        </p>
        <CodeBlock
          title="rune"
          code={'# Arithmetic\n+ - * / % **\n\n# Comparison\n== != === !== < <= > >=\n\n# Logic\nand or not     # also && || !\n\n# Membership\nx in list\n\n# Unary and increments\n- +     i++     i--\n\n# Ternary\ncond ? a : b\n\n# Assignment\n= += -= *= /= %= **='}
        />
        <p>
          <code className="font-mono text-orange-light">==</code> and{" "}
          <code className="font-mono text-orange-light">!=</code> compare loosely:{" "}
          <code className="font-mono text-orange-light">null</code> and{" "}
          <code className="font-mono text-orange-light">undefined</code> count as equal, and
          numbers and booleans coerce. So <code className="font-mono text-orange-light">"5" == 5</code>{" "}
          is true. To check whether an argument or lookup is missing, compare against{" "}
          <code className="font-mono text-orange-light">null</code>.
        </p>
        <CodeBlock
          title="rune"
          code={'# add an arg for this to work\n\nif (args.0 == null) { say("give me an argument!") }'}
        />
      </GuideSection>
    </GuidePage>
  );
}