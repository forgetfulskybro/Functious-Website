import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import ProseTable from '@/components/guide/ProseTable';
import { STICKIES_GUIDE, findChapter } from '@/data/guides';

export default function StickiesEditing() {
  const chapter = findChapter(STICKIES_GUIDE, 'editing')!;

  return (
    <GuidePage
      guide={STICKIES_GUIDE}
      chapter={chapter}
      description="Edit the content, switch formats, change where a sticky lives, and control its mentions and repost behavior."
    >
      <GuideSection title="Sticky commands">
        <ProseTable
          headers={['Command', 'What it does']}
          rows={[
            ['f!sticky create [#channel]', 'Open the editor for a new sticky in this or another channel.'],
            ['f!sticky list', 'List every sticky in the community.'],
            ['f!sticky view <number>', 'Show a sticky\'s settings and a preview of its content.'],
            ['f!sticky edit <number>', 'Open the editor for an existing sticky.'],
            ['f!sticky type <number> content|embed|script', 'Switch the sticky format and start a fresh editor.'],
            ['f!sticky move <number> #channel', 'Move a sticky to another channel.'],
            ['f!sticky delay <number> <seconds>', 'Change the repost delay from 1 to 60 seconds.'],
            ['f!sticky mentions <number> none|users|roles|everyone', 'Set which mentions the sticky may send.'],
            ['f!sticky toggle <number>', 'Enable or disable the sticky.'],
            ['f!sticky refresh <number>', 'Delete the current sticky and repost it now.'],
            ['f!sticky delete <number>', 'Delete the sticky after a confirmation.'],
            ['f!sticky stop', 'Cancel the editor you currently have open.'],
          ]}
        />
        <p>
          The command aliases are <code className="font-mono text-orange-light">f!stick</code> and{' '}
          <code className="font-mono text-orange-light">f!stickies</code>. Sticky numbers come from{' '}
          <code className="font-mono text-orange-light">f!sticky list</code>.
        </p>
      </GuideSection>

      <GuideSection title="Editing content">
        <p>
          <code className="font-mono text-orange-light">f!sticky edit &lt;number&gt;</code> opens
          the same editor used during creation. For messages and Rune scripts, send the new content
          when prompted. For embeds, the editor walks through each field separately.
        </p>
        <p>
          During the embed editor, send <code className="font-mono text-orange-light">skip</code>{' '}
          to keep the current value, <code className="font-mono text-orange-light">none</code> to
          clear a field, <code className="font-mono text-orange-light">done</code> to save, or{' '}
          <code className="font-mono text-orange-light">cancel</code> to abort.
        </p>
        <ProseTable
          headers={['Embed field', 'What it controls']}
          rows={[
            ['Title', 'The embed title.'],
            ['Description', 'The main embed text.'],
            ['Color', 'A hex color, named color, or RGB value.'],
            ['Footer text', 'Small text at the bottom of the embed.'],
            ['Footer icon URL', 'Icon shown beside the footer text.'],
            ['Image URL', 'Large image below the description.'],
            ['Thumbnail URL', 'Small image in the corner.'],
            ['Author name', 'Name shown above the title.'],
            ['Author icon URL', 'Icon shown beside the author name.'],
            ['Author link URL', 'Link applied to the author name.'],
            ['Title link URL', 'Link applied to the embed title.'],
            ['Timestamp', 'Whether to show the current time.'],
          ]}
        />
        <p>You can also paste an embed shortcut directly:</p>
        <CodeBlock
          title="Embed shortcuts"
          code={`{title:Community Rules}\n{desc:Be kind and follow the community guidelines.}\n{color:#A52F05}\n{footer:Updated by staff}`}
        />
      </GuideSection>

      <GuideSection title="Changing the type">
        <p>
          Use <code className="font-mono text-orange-light">f!sticky type &lt;number&gt; content</code>,{' '}
          <code className="font-mono text-orange-light">embed</code>, or{' '}
          <code className="font-mono text-orange-light">script</code> to switch formats. The bot
          starts a fresh editor for the new type so you can build the replacement content.
        </p>
        <CodeBlock
          title="Fluxer"
          code={`f!sticky type 1 embed\nf!sticky type 1 script`}
        />
      </GuideSection>

      <GuideSection title="Moving, pausing, and refreshing">
        <p>
          Moving a sticky deletes its current message and posts it in the new channel. A channel
          can only have one sticky, so the move is rejected if the target channel already has one.
        </p>
        <p>
          Disabling a sticky removes its current message but keeps its settings. Enabling it again
          posts it immediately. Refresh is useful after editing the content if you want to replace
          the live message right away.
        </p>
        <CodeBlock
          title="Fluxer"
          code={`f!sticky move 1 #rules\nf!sticky delay 1 10\nf!sticky mentions 1 roles\nf!sticky disable 1\nf!sticky enable 1\nf!sticky refresh 1`}
        />
      </GuideSection>

      <GuideSection title="Deleting a sticky">
        <p>
          <code className="font-mono text-orange-light">f!sticky delete &lt;number&gt;</code> asks
          for confirmation with reactions. Confirming removes the sticky message and its saved
          settings. Cancelling leaves everything unchanged.
        </p>
      </GuideSection>

      <GuideSection title="Dashboard">
        <p>
          The dashboard Stickies page can edit the same content, delay, mention policy, channel,
          and enabled state. It also supports creating and deleting stickies without using the
          reaction editor.
        </p>
        <Callout title="One editor at a time">
          A member can only have one sticky editor open at a time. Run{' '}
          <code className="font-mono text-orange-light">f!sticky stop</code> before starting
          another one.
        </Callout>
      </GuideSection>
    </GuidePage>
  );
}
