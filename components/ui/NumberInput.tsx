'use client';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  compact?: boolean;
  disabled?: boolean;
}

export default function NumberInput({
  value,
  onChange,
  min = 1,
  max = 100,
  placeholder = '1',
  compact = false,
  disabled = false,
}: NumberInputProps) {
  function clamp(n: number) {
    return Math.max(min, Math.min(max, n));
  }

  function decrement() {
    onChange(clamp(value - 1));
  }

  function increment() {
    onChange(clamp(value + 1));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) onChange(clamp(parsed));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const parsed = parseInt(e.target.value, 10);
    onChange(isNaN(parsed) ? min : clamp(parsed));
  }

  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div
      className={[
        'flex items-center w-full bg-white/5 overflow-hidden',
        compact ? 'rounded-md min-h-[30px]' : 'rounded-lg min-h-[42px]',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || atMin}
        className={[
          'px-2.5 h-full text-white/40 hover:text-white hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none leading-none flex-shrink-0',
          compact ? 'text-sm' : 'text-base',
        ].join(' ')}
        aria-label="Decrease"
      >
        −
      </button>

      <input
        type="number"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        min={min}
        max={max}
        disabled={disabled}
        className={[
          'flex-1 min-w-0 bg-transparent text-center text-white focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          compact ? 'text-[11px]' : 'text-sm',
        ].join(' ')}
      />

      <button
        type="button"
        onClick={increment}
        disabled={disabled || atMax}
        className={[
          'px-2.5 h-full text-white/40 hover:text-white hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none leading-none flex-shrink-0',
          compact ? 'text-sm' : 'text-base',
        ].join(' ')}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
