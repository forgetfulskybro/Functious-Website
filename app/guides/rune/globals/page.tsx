import type { Metadata } from 'next';
import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import ProseTable from '@/components/guide/ProseTable';
import Callout from '@/components/guide/Callout';
import { RUNE_GUIDE, findChapter } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Context | Rune Guide',
  description:
    'The context globals in Rune tags: $user, $channel, $message, $guild, and args.',
};

export default function RuneGlobalsPage() {
  const chapter = findChapter(RUNE_GUIDE, 'globals')!;

  return (
    <GuidePage
      guide={RUNE_GUIDE}
      chapter={chapter}
      description="Every tag has access to four context globals and the args array. They are plain dictionaries, so you read them with dot notation: $user.username."
    >
      <GuideSection title="$user">
        <p>The person who ran the tag.</p>
        <ProseTable
          headers={['field', 'description']}
          rows={[
            ['id', 'user id'],
            ['username', 'username'],
            ['discriminator', 'discriminator, like 0001'],
            ['tag', 'username and discriminator together, like rubik#0001'],
            ['display_name', 'the name shown in chat'],
            ['global_name', 'global display name'],
            ['avatar', 'avatar hash'],
            ['avatar_url', 'avatar image URL'],
            ['banner', 'banner hash'],
            ['bot', 'true if this is a bot'],
            ['system', 'true if this is a system account'],
            ['created_at', 'account creation date'],
          ]}
        />
      </GuideSection>

      <GuideSection title="$channel">
        <p>The channel the tag was sent in.</p>
        <ProseTable
          headers={['field', 'description']}
          rows={[
            ['id', 'channel id'],
            ['name', 'channel name'],
            ['type', 'channel type number'],
            ['guild_id', 'id of the guild it belongs to'],
            ['position', 'position in the channel list'],
            ['topic', 'channel topic'],
            ['nsfw', 'true for NSFW channels'],
            ['mention', 'the channel mention string'],
            ['rate_limit', 'slowmode in seconds'],
            ['created_at', 'channel creation date'],
          ]}
        />
      </GuideSection>

      <GuideSection title="$message">
        <p>The message that invoked the tag.</p>
        <ProseTable
          headers={['field', 'description']}
          rows={[
            ['id', 'message id'],
            ['content', 'full message text'],
            ['author_id', 'id of the author'],
            ['author', 'the $user dict for the author'],
            ['channel_id', 'channel it was sent in'],
            ['guild_id', 'guild it was sent in'],
            ['created_at', 'when it was sent'],
            ['edited_timestamp', 'when it was last edited'],
            ['mentions', 'list of users mentioned'],
            ['mention_roles', 'list of role ids mentioned'],
            ['mention_everyone', 'true if it pings everyone'],
            ['attachments', 'list of attachments'],
            ['pinned', 'true if pinned'],
            ['tts', 'true if sent with text to speech'],
            ['webhook_id', 'webhook id if sent by a webhook'],
            ['type', 'message type number'],
            ['flags', 'message flags'],
            ['url', 'link to the message'],
          ]}
        />
      </GuideSection>

      <GuideSection title="$guild">
        <p>The server the tag was sent in, if there is one.</p>
        <ProseTable
          headers={['field', 'description']}
          rows={[
            ['id', 'guild id'],
            ['name', 'guild name'],
            ['icon', 'icon hash'],
            ['icon_url', 'icon image URL'],
            ['banner', 'banner hash'],
            ['banner_url', 'banner image URL'],
            ['description', 'guild description'],
            ['owner_id', 'id of the owner'],
            ['features', 'list of guild features'],
            ['premium_tier', 'boost tier'],
            ['member_count', 'number of members'],
            ['preferred_locale', 'server language'],
            ['created_at', 'guild creation date'],
          ]}
        />
      </GuideSection>

      <GuideSection title="args">
        <p>
          The text after the tag name when it is invoked, split into{" "}
          <code className="font-mono text-orange-light">args.0</code>,{" "}
          <code className="font-mono text-orange-light">args.1</code>, and so on.{" "}
          <code className="font-mono text-orange-light">args</code> is always an array, even when
          no arguments were passed.
        </p>
        <CodeBlock
          title="rune"
          code={'args.0        # first argument\nlen(args)     # how many there are\nargs[len(args) - 1]   # the last one'}
        />
        <Callout title="Not given?">
          Check for a missing argument with <code className="font-mono text-orange-light">== null</code>.
          That is how the tags in the Examples chapter guard their usage.
        </Callout>
      </GuideSection>
    </GuidePage>
  );
}
