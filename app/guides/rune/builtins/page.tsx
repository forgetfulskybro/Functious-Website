import type { Metadata } from 'next';
import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import ProseTable from '@/components/guide/ProseTable';
import { RUNE_GUIDE, findChapter } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Builtins | Rune Guide',
  description:
    'The complete Rune standard library: output, math, randomness, strings, lists, dictionaries, JSON, dates, regex, markdown, and mentions.',
};

const SECTIONS = [
  { id: 'output', label: 'Output' },
  { id: 'math', label: 'Math' },
  { id: 'random', label: 'Random' },
  { id: 'strings', label: 'Strings' },
  { id: 'lists', label: 'Lists' },
  { id: 'dictionaries', label: 'Dictionaries' },
  { id: 'conversion', label: 'Conversion & JSON' },
  { id: 'types', label: 'Type checks' },
  { id: 'dates', label: 'Dates' },
  { id: 'regex', label: 'Regex' },
  { id: 'markdown', label: 'Markdown helpers' },
  { id: 'mentions', label: 'Mentions & users' },
];

export default function RuneBuiltinsPage() {
  const chapter = findChapter(RUNE_GUIDE, 'builtins')!;

  return (
    <GuidePage
      guide={RUNE_GUIDE}
      chapter={chapter}
      description="Rune ships a compact standard library. Every builtin is available as a bare function, and most also work as methods. &quot;abc&quot;.toUpperCase() and upper(&quot;abc&quot;) are the same call."
    >
      <nav aria-label="On this page" className="rounded-xl border border-white/10 bg-[#140b08] p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">
          On this page
        </p>
        <ol className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-sm text-white/60 transition-colors hover:text-orange-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange rounded"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <GuideSection id="output" title="Output">
        <p>
          Send text with <code className="font-mono text-orange-light">say</code>. It accepts
          any number of values. Pass an embed built with{" "}
          <code className="font-mono text-orange-light">embed()</code> to send an embed instead.
        </p>
        <CodeBlock title="rune" code={'say("one message")\nsay("second", "and", "third")'} />
        <ProseTable
          headers={['function', 'does']}
          rows={[
            ['say(...)', 'sends the values as a message'],
            ['echo(...)', 'same as say'],
          ]}
        />
      </GuideSection>

      <GuideSection id="math" title="Math">
        <p>
          Rounding, powers, trigonometry, and clamping. Note that{" "}
          <code className="font-mono text-orange-light">range</code> returns a list.
        </p>
        <ProseTable
          headers={['function', 'does']}
          rows={[
            ['min(a, b, ...)', 'smallest of the numbers'],
            ['max(a, b, ...)', 'largest of the numbers'],
            ['abs(x)', 'absolute value'],
            ['floor(x)', 'rounds down'],
            ['ceil(x)', 'rounds up'],
            ['round(x, digits)', 'rounds, optionally to a number of digits'],
            ['sqrt(x)', 'square root'],
            ['pow(a, b)', 'a to the power of b'],
            ['sin(x) cos(x) tan(x)', 'trigonometry'],
            ['log(x)', 'natural log'],
            ['log10(x)', 'base 10 log'],
            ['exp(x)', 'e to the power of x'],
            ['clamp(x, lo, hi)', 'clamps x into the range'],
            ['range(end)', '[0, 1, ..., end-1]'],
            ['range(start, end)', 'numbers from start to end-1'],
            ['range(start, end, step)', 'with a custom step'],
          ]}
        />
      </GuideSection>

      <GuideSection id="random" title="Random">
        <p>Everything you need for games, giveaways, and dice.</p>
        <ProseTable
          headers={['function', 'does']}
          rows={[
            ['random()', 'a float between 0 and 1'],
            ['randomFloat(lo, hi)', 'a float in a range'],
            ['randomInt(lo, hi)', 'an integer in a range, both ends included'],
            ['choose(list)', 'a random item from a list'],
            ['shuffle(list)', 'a shuffled copy of a list'],
          ]}
        />
        <CodeBlock
          title="rune"
          code={'roll = randomInt(1, 6)\npick = choose(["rock", "paper", "scissors"])\nsay("you rolled a " + str(roll) + " and picked " + pick)'}
        />
      </GuideSection>

      <GuideSection id="strings" title="Strings">
        <p>
          Case, splitting, slicing, searching, and padding. The string builtins also work as
          methods.
        </p>
        <ProseTable
          headers={['function', 'does']}
          rows={[
            ['str(x)', 'converts to a string'],
            ['lower(s) / upper(s)', 'changes case'],
            ['capitalize(s)', 'first letter upper, rest lower'],
            ['title(s)', 'first letter of each word upper'],
            ['strip(s) / trim(s)', 'removes surrounding whitespace'],
            ['lstrip(s) / rstrip(s)', 'removes whitespace on one side'],
            ['split(s, sep)', 'splits into a list'],
            ['join(list, sep)', 'joins a list into a string'],
            ['replace(s, from, to)', 'replaces every occurrence'],
            ['substring(s, start, end)', 'part of a string'],
            ['slice(x, start, end)', 'works on strings and lists'],
            ['length(x) / len(x)', 'size of a string, list, or dict'],
            ['strlen(s)', 'length of a string'],
            ['indexOf(s, sub)', 'position of sub, or -1'],
            ['startsWith(s, pre) / endsWith(s, post)', 'checks the start and end'],
            ['contains(x, item) / includes(x, item)', 'works on strings and lists'],
            ['repeat(s, n)', 'the string repeated'],
            ['count(s, sub)', 'how many times sub appears'],
            ['charAt(s, i)', 'the character at index i'],
            ['reverse(x)', 'works on strings and lists'],
            ['format(s, ...)', 'format("{0} and {1}", a, b)'],
            ['padStart(s, n, pad) / padEnd(s, n, pad)', 'pads to a length'],
          ]}
        />
      </GuideSection>

      <GuideSection id="lists" title="Lists">
        <p>
          Build, transform, and reduce lists. The higher-order functions take a tag function.
        </p>
        <ProseTable
          headers={['function', 'does']}
          rows={[
            ['push(list, ...) / append(list, ...)', 'adds to the end'],
            ['pop(list)', 'removes and returns the last'],
            ['shift(list)', 'removes and returns the first'],
            ['unshift(list, ...) / prepend(list, ...)', 'adds to the front'],
            ['sort(list, ", ")', 'returns a sorted copy'],
            ['concat(list, ...)', 'joins lists together'],
            ['flatten(list)', 'flattens one level'],
            ['unique(list)', 'removes duplicates'],
            ['sum(list)', 'adds up the numbers'],
            ['first(list) / last(list)', 'the ends'],
            ['map(list, fn)', 'applies fn to each item'],
            ['filter(list, fn)', 'keeps items where fn is true'],
            ['reduce(list, fn, initial)', 'folds the list'],
            ['forEach(list, fn)', 'runs fn for each item'],
            ['find(list, fn)', 'first item where fn is true'],
            ['some(list, fn) / any(list, fn)', 'true if any item matches'],
            ['every(list, fn) / all(list, fn)', 'true if all items match'],
          ]}
        />
      </GuideSection>

      <GuideSection id="dictionaries" title="Dictionaries">
        <p>Inspect and mutate dicts without fuss.</p>
        <ProseTable
          headers={['function', 'does']}
          rows={[
            ['keys(d)', 'the keys as a list'],
            ['values(d)', 'the values as a list'],
            ['entries(d) / items(d)', '[[key, value], ...]'],
            ['has(d, key)', 'true if the key exists'],
            ['get(d, key, fallback)', 'value or fallback'],
            ['set(d, key, value)', 'sets a key'],
            ['delete(d, key) / remove(d, key)', 'removes a key'],
            ['merge(d, ...)', 'a copy with others merged in'],
            ['update(d, ...)', 'merges into the dict in place'],
          ]}
        />
      </GuideSection>

      <GuideSection id="conversion" title="Conversion & JSON">
        <p>Coerce values and move data in and out of JSON.</p>
        <ProseTable
          headers={['function', 'does']}
          rows={[
            ['int(x) / float(x) / bool(x)', 'converts a value'],
            ['num(x) / number(x)', 'converts to a number'],
            ['jsonParse(s) / fromJson(s)', 'parses JSON'],
            ['jsonStringify(x) / toJson(x)', 'turns a value into JSON'],
            ['dump(x)', 'pretty-printed JSON'],
            ['base64Encode(s) / base64Decode(s)', 'base64 conversion'],
          ]}
        />
      </GuideSection>

      <GuideSection id="types" title="Type checks">
        <p>Ask what something is before you use it.</p>
        <ProseTable
          headers={['function', 'does']}
          rows={[
            ['type(x) / typeof(x)', 'number, string, array, dict, ...'],
            ['isNumber(x) isString(x) isBool(x)', 'checks the type'],
            ['isArray(x) isDict(x)', 'checks the type'],
            ['isNull(x) isUndefined(x)', 'checks the type'],
            ['isFunction(x)', 'true for tag functions'],
            ['isEmbed(x)', 'true for embeds'],
          ]}
        />
      </GuideSection>

      <GuideSection id="dates" title="Dates">
        <p>
          Timestamps are in milliseconds. <code className="font-mono text-orange-light">now()</code>{" "}
          returns seconds, <code className="font-mono text-orange-light">nowMs()</code> returns
          milliseconds.
        </p>
        <ProseTable
          headers={['function', 'does']}
          rows={[
            ['now() / timestamp() / unix()', 'current time in seconds'],
            ['nowMs()', 'current time in milliseconds'],
            ['date(x)', 'a date from a timestamp or string'],
            ['strftime(date, format)', 'formats a date'],
            ['year(d) month(d) day(d)', 'parts of a date'],
            ['hour(d) minute(d) second(d)', 'parts of a time'],
          ]}
        />
        <Callout title="strftime codes">
          <code className="font-mono text-orange-light">%Y %m %d %H %M %S %y %L</code>: year,
          month, day, hour, minute, second, short year, and millisecond.
        </Callout>
      </GuideSection>

      <GuideSection id="regex" title="Regex">
        <p>
          Build a pattern with <code className="font-mono text-orange-light">regex(pattern, flags)</code>.
          Inside a string, escape a backslash so it survives. Write{" "}
          <code className="font-mono text-orange-light">regex("\\d")</code> for a digit.
        </p>
        <ProseTable
          headers={['function', 'does']}
          rows={[
            ['regex(pattern, flags)', 'builds a pattern'],
            ['test(s, re)', 'true if the pattern matches'],
            ['match(s, re)', 'first match, or all matches if the pattern is global'],
            ['regexReplace(s, re, replacement)', 'replaces every match'],
          ]}
        />
        <CodeBlock
          title="rune"
          code={'re = regex("\\\\d+")\nif (test("room 42", re)) { say("has a number") }'}
        />
      </GuideSection>

      <GuideSection id="markdown" title="Markdown helpers">
        <p>These wrap text in Fluxer formatting.</p>
        <ProseTable
          headers={['function', 'output']}
          rows={[
            ['bold(s)', '**bold**'],
            ['italic(s)', '*italic*'],
            ['underline(s)', '__underline__'],
            ['strikethrough(s)', '~~strikethrough~~'],
            ['spoiler(s)', '||spoiler||'],
            ['code(s)', '```a code block```'],
            ['inlineCode(s)', '`inline code`'],
            ['quote(s)', '> This is a quote'],
            ['link(text, url)', '[a hyperlink](https://functious.vercel.app/guides/rune)'],
          ]}
        />
      </GuideSection>

      <GuideSection id="mentions" title="Mentions & users">
        <p>Build mentions and read user dicts from the context globals.</p>
        <ProseTable
          headers={['function', 'does']}
          rows={[
            ['mention(id)', 'mentions a user, channel, or role by id'],
            ['userMention(id) / channelMention(id)', 'a specific mention'],
            ['roleMention(id)', 'a role mention'],
            ['everyoneMention() / hereMention()', 'pings everyone or here'],
            ['userTag(d)', 'username#discriminator for a user dict'],
            ['displayName(d)', 'the display name for a user dict'],
            ['avatarURL(d)', 'the avatar URL for a user dict'],
          ]}
        />
      </GuideSection>
    </GuidePage>
  );
}