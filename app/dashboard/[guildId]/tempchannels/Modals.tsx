

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = 'orange',
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'orange' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#160a0a] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2A1313]">
          <div>
            <h2 className="text-white font-bold text-lg">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-white/40 hover:text-white text-xl disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-white/60 text-sm leading-relaxed">{description}</p>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 font-medium disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={[
              'flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50 transition-colors',
              confirmVariant === 'danger'
                ? 'bg-red-500/80 hover:bg-red-500'
                : 'bg-orange hover:bg-orange-bright',
            ].join(' ')}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}