"use client";

export function Toggle({
  value,
  onChangeAction,
  disabled,
}: {
  value: boolean;
  onChangeAction: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChangeAction(!value)}
      className={[
        'relative inline-flex w-10 h-5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bg-dark disabled:opacity-40',
        value ? 'bg-orange' : 'bg-white/10',
      ].join(' ')}
    >
      <span
        className={[
          'block w-3.5 h-3.5 rounded-full bg-white shadow top-[3px] absolute transition-transform duration-200',
          value ? 'translate-x-[22px]' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  );
}
