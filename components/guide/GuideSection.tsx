interface GuideSectionProps {
  id?: string;
  title: string;
  children: React.ReactNode;
}

export default function GuideSection({ id, title, children }: GuideSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className="mt-12 scroll-mt-24 first:mt-0"
    >
      <h2 id={id ? `${id}-heading` : undefined} className="mb-4 text-xl font-semibold text-white">
        {title}
      </h2>
      <div className="space-y-4 text-base leading-relaxed text-white/70">{children}</div>
    </section>
  );
}
