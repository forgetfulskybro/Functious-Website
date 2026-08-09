import GuideSidebar from './GuideSidebar';
import type { Guide } from '@/data/guides';

export default function GuideShell({ guide, children }: { guide: Guide; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-dark">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="lg:flex lg:gap-12">
          <GuideSidebar guide={guide} />
          <main className="min-w-0 flex-1 lg:max-w-3xl">{children}</main>
        </div>
      </div>
    </div>
  );
}
