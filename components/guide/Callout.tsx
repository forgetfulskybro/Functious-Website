interface CalloutProps {
  title?: string;
  children: React.ReactNode;
}

export default function Callout({ title, children }: CalloutProps) {
  return (
    <div className="rounded-xl border border-orange/25 bg-orange/10 px-4 py-3.5">
      {title && (
        <p className="text-sm font-semibold text-orange-light">{title}</p>
      )}
      <div className={title ? 'mt-1 text-sm leading-relaxed text-white/75' : 'text-sm leading-relaxed text-white/75'}>
        {children}
      </div>
    </div>
  );
}