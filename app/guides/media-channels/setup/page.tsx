import GuidePage from '@/components/guide/GuidePage';
import GuideSection from '@/components/guide/GuideSection';
import CodeBlock from '@/components/guide/CodeBlock';
import Callout from '@/components/guide/Callout';
import { MEDIA_CHANNELS_GUIDE, findChapter } from '@/data/guides';

export default function MediaChannelsSetup() {
  const chapter = findChapter(MEDIA_CHANNELS_GUIDE, 'setup')!;
  return (
    <GuidePage guide={MEDIA_CHANNELS_GUIDE} chapter={chapter} description="Add a channel and choose exactly what content is allowed in it.">

      <GuideSection title="Adding a channel">
        <p>
          Run <code className="font-mono text-orange-light">f!mc add</code> with a channel mention, then
          add any flags you need. Without any flags, any attachment is allowed (images, videos,
          files).
        </p>
        <CodeBlock title="Fluxer -any attachment" code="f!mc add #media" />
        <CodeBlock title="Fluxer -images only" code="f!mc add #media --images" />
        <CodeBlock title="Fluxer -images and links" code="f!mc add #media --images --links" />
      </GuideSection>

      <GuideSection title="Attachment flags">
        <p>
          Flags can be combined freely. If none are specified, <code className="font-mono text-orange-light">--attachments</code> is
          assumed. Once you specify at least one of the specific flags, the broad
          "any attachment" default is turned off unless you also include <code className="font-mono text-orange-light">--attachments</code>.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><code className="font-mono text-orange-light">--attachments</code> - any attachment (images, videos, files).</li>
          <li><code className="font-mono text-orange-light">--images</code> - png, jpg, jpeg, gif, webp, bmp, tiff, avif.</li>
          <li><code className="font-mono text-orange-light">--videos</code> - mp4, mov, webm, mkv, avi, wmv, flv, m4v.</li>
          <li><code className="font-mono text-orange-light">--files</code> - everything else: zip, pdf, txt, etc.</li>
          <li><code className="font-mono text-orange-light">--links</code> - bare URLs with no attachment required.</li>
        </ul>
        <Callout title="Mixed attachments">
          If a message contains multiple attachments, every single one must pass. A message with
          one permitted image and one disallowed file will be deleted.
        </Callout>
      </GuideSection>

      <GuideSection title="Editing a channel">
        <p>Change settings on an existing channel using <code className="font-mono text-orange-light">edit</code> - it takes the same flags as <code className="font-mono text-orange-light">add</code>:</p>
        <CodeBlock title="Fluxer" code="f!mc edit #media --images --videos --rating" />
      </GuideSection>

      <GuideSection title="Removing a channel">
        <p>Stop enforcing media-only rules and remove the channel from the bot&apos;s config:</p>
        <CodeBlock title="Fluxer" code="f!mc remove #media" />
      </GuideSection>

      <GuideSection title="Listing configured channels">
        <CodeBlock title="Fluxer" code="f!mc list" />
      </GuideSection>
    </GuidePage>
  );
}
