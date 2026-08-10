import type { Metadata } from 'next';
import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import ProseTable from '@/components/guide/ProseTable';
import Callout from '@/components/guide/Callout';
import { RUNE_GUIDE, findChapter } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Examples | Rune Guide',
  description:
    'Real working Rune tags: dice, games, ciphers, statistics embeds, and more. Each one is ready to save as a tag.',
};

interface ExampleProps {
  name: string;
  shows: string;
  invoke: string;
  code: string;
}

function Example({ name, shows, invoke, code }: ExampleProps) {
  return (
    <div>
      <h3 className="mb-1 text-lg font-semibold text-white">{name}</h3>
      <p className="mb-3 text-sm text-white/60">{shows}</p>
      <CodeBlock title="Fluxer" code={invoke} />
      <div className="mt-3">
        <CodeBlock title="rune" code={code} />
      </div>
    </div>
  );
}

export default function RuneExamplesPage() {
  const chapter = findChapter(RUNE_GUIDE, 'examples')!;

  return (
    <GuidePage
      guide={RUNE_GUIDE}
      chapter={chapter}
      description="Real tags you can save and run as-is, from dice and minigames to a full statistics embed."
    >
      <GuideSection title="How these work">
        <p>
          Every example in this chapter is the content of a working tag. Paste the code in as a
          tag&apos;s content, either in the dashboard or with{" "}
          <code className="font-mono text-orange-light">f!tags add &lt;name&gt; text ...</code>{" "}
          for single-line tags. Then run it by name. Anything after the tag name arrives as{" "}
          <code className="font-mono text-orange-light">args</code>.
        </p>
      </GuideSection>

      <GuideSection title="Dice roller">
        <Example
          name="a dice roller"
          shows="split, int, a for loop, push, join, and sum. Pass a spec like 2d6."
          invoke={'f!tags dice 2d6'}
          code={'spec = "1d6"\nif (args.0 != null) { spec = args.0 }\nparts = split(spec, "d")\nrolls = int(parts.0)\nsides = int(parts.1)\n\nif (rolls < 1) { rolls = 1 }\nif (sides < 2) { sides = 2 }\n\nresults = []\nfor (i = 0; i < rolls; i++) {\n  results.push(randomInt(1, sides))\n}\n\nsay("rolled " + rolls + "d" + sides + ": " + join(results, ", ") + " (total " + sum(results) + ")")'}
        />
      </GuideSection>

      <GuideSection title="RPS">
        <Example
          name="Rock, paper, scissors"
          shows="a dict of winning pairs, choose for the random pick, and an if/elif/else chain."
          invoke={'f!tags rps rock'}
          code={'# Put scissors, paper, or rock in args to make the game work\nargs = [""]\nmoves = ["rock", "paper", "scissors"]\nbeats = { rock: "scissors", paper: "rock", scissors: "paper" }\n\nuserMove = ""\nif (args.0 != null) { userMove = lower(args.0) }\nbotMove = choose(moves)\n\nif (userMove == "") {\n  say("Play with: f!tags rps rock|paper|scissors")\n} elif (userMove == botMove) {\n  say("Tie! You both played " + userMove)\n} elif (beats[userMove] == botMove) {\n  say("You win! " + userMove + " beats " + botMove)\n} else {\n  say("You lose! " + botMove + " beats " + userMove)\n}'}
        />
      </GuideSection>

      <GuideSection title="Fibonacci">
        <Example
          name="recursive functions"
          shows="named functions with return, plus a classic counter loop."
          invoke={'f!tags fibonacci'}
          code={'fn fib(n) {\n  if (n <= 1) { return n }\n  return fib(n - 1) + fib(n - 2)\n}\n\nfor (i = 0; i < 10; i++) {\n  say("fib(" + i + ") = " + fib(i))\n}'}
        />
      </GuideSection>

      <GuideSection title="Password generator">
        <Example
          name="a random password"
          shows="choose, split, a loop, join, and shuffle, wrapped in a code block."
          invoke={'f!tags password 16'}
          code={'pwlen = 12\nif (args.0 != null) { pwlen = int(args.0) }\nif (pwlen < 8) { pwlen = 12 }\nif (pwlen > 64) { pwlen = 64 }\n\nlower = "abcdefghijklmnopqrstuvwxyz"\nupper = uppercase(lower)\ndigits = "0123456789"\nsymbols = "!@#$%^&*"\npool = lower + upper + digits + symbols\n\npw = [\n  choose(lower.split("")),\n  choose(upper.split("")),\n  choose(digits.split("")),\n  choose(symbols.split("")),\n]\nfor (i = 4; i < pwlen; i++) {\n  pw.push(choose(pool.split("")))\n}\n\nsay("your password: " + code(join(shuffle(pw), "")))\nsay("length: [pwlen], symbols available: " + len(symbols))'}
        />
      </GuideSection>

      <GuideSection title="Caesar cipher">
        <Example
          name="a Caesar cipher"
          shows="indexOf into the alphabet, charAt back out, and while loops to wrap around."
          invoke={'f!tags caesar "attack at dawn" 3'}
          code={'text = "attack at dawn"\nshift = 3\nif (args.0 != null) { text = args.0 }\nif (args.1 != null) { shift = int(args.1) }\n\nletters = "abcdefghijklmnopqrstuvwxyz"\nout = ""\nfor (c in lower(text).split("")) {\n  i = indexOf(letters, c)\n  if (i >= 0) {\n    idx = i + shift\n    while (idx < 0) { idx += 26 }\n    while (idx > 25) { idx -= 26 }\n    out += charAt(letters, idx)\n  } else {\n    out += c\n  }\n}\nsay(out)'}
        />
      </GuideSection>

      <GuideSection title="Word count">
        <Example
          name="a frequency counter"
          shows="nested loops, dict tallying with has, sort with a comparator, and embed fields built in a loop."
          invoke={'f!tags wordcount the quick brown fox jumps over the lazy dog the'}
          code={'words = ["wordcount", "the", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog", "the"]\nfor (a in args) {\n  for (w in split(lower(a), " ")) {\n    if (len(w) > 0) { words.push(w) }\n  }\n}\n\ncounts = {}\nfor (w in words) {\n  if (counts.has(w)) {\n    counts[w] = counts[w] + 1\n  } else {\n    counts[w] = 1\n  }\n}\n\nsorted = sort(entries(counts), fn(p) { return -p.1 })\ntop = sorted.slice(0, 5)\n\ne = embed()\ne.title("Word count")\ne.description("counted [len(words)] words in [len(args)] argument(s)")\nfor (i = 0; i < len(top); i++) {\n  e.field(top[i].0, top[i].1, true)\n}\nsay(e)'}
        />
      </GuideSection>

      <GuideSection title="Statistics embed">
        <Example
          name="min, max, mean, median, mode"
          shows="sort on a copy, modulo for the median, dict tallying for the mode, and a finished embed."
          invoke={'f!tags stats 4 8 15 16 23 42'}
          code={'nums = []\nfor (a in args) {\n  nums.push(num(a))\n}\nif (len(nums) == 0) { nums = [1, 2, 3, 4, 5] }\n\ns = sort(nums)\nn = len(s)\nmean = sum(s) / n\nif (n % 2 == 1) {\n  median = s[(n - 1) / 2]\n} else {\n  median = (s[n / 2] + s[n / 2 - 1]) / 2\n}\n\ntally = {}\nfor (x in s) {\n  if (tally.has(x)) {\n    tally[x] = tally[x] + 1\n  } else {\n    tally[x] = 1\n  }\n}\nbest = 0\nmode = "none"\nfor (k in keys(tally)) {\n  if (tally[k] > best) {\n    best = tally[k]\n    mode = k\n  }\n}\n\ne = embed()\ne.title("Stats")\ne.description("n = " + n + ", mean = " + round(mean, 2))\ne.field("Min", s.0, true)\ne.field("Max", last(s), true)\ne.field("Median", round(median, 2), true)\ne.field("Mode", mode, true)\ne.field("Sum", sum(s), true)\nsay(e)'}
        />
      </GuideSection>

      <GuideSection title="User info">
        <Example
          name="a profile card"
          shows="the $user globals, mention and strftime, and guarding against missing fields."
          invoke={'f!tags userinfo'}
          code={'e = embed()\ne.color(0x5865F2)\nif ($user.avatar_url != null) { e.thumbnail($user.avatar_url) }\nif ($user.display_name != null) {\n  e.title($user.display_name)\n} else {\n  e.title($user.username)\n}\ne.description(mention($user.id) + "  " + $user.tag)\nif ($user.id != null) { e.field("ID", $user.id, true) }\nif ($user.username != null) { e.field("Username", $user.username, true) }\nif ($user.global_name != null) { e.field("Global name", $user.global_name, true) }\ne.field("Bot", $user.bot, true)\nif ($user.created_at != null) {\n  e.field("Account created", strftime($user.created_at, "%b %d %Y"), true)\n}\ne.footer($user.tag)\nsay(e)'}
        />
      </GuideSection>

      <GuideSection title="Regex">
        <Example
          name="regex helpers"
          shows="Shows off test, regexReplace, and match against a sample string."
          invoke={'f!tags regex'}
          code={'text = "call me at 555-1234"\n\nsay("has digits: " + test(text, regex("\\\\d+")))\nsay("redacted: " + regexReplace(text, regex("\\\\d"), "X"))\nsay("first word: " + match(text, regex("[A-Za-z]+")))\nsay("all numbers: " + join(match(text, regex("[0-9]+", "g")), ", "))'}
        />
      </GuideSection>

      <GuideSection title="More to explore">
        <Callout title="Start somewhere">
          Save any tag with <code className="font-mono text-orange-light">f!tags add</code> or in
          the dashboard, run it by name, and start tweaking. The rest of this guide has every
          piece it uses.
        </Callout>
      </GuideSection>
    </GuidePage>
  );
}