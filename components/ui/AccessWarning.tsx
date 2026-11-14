export default function AccessWarning({
  message,
  className = '',
}: {
  message: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={message}
      title={message}
      className={`inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 text-[9px] font-bold leading-none text-red-400 ${className}`}
    >
      !
    </span>
  );
}
