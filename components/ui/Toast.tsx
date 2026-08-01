'use client';

import { toast } from 'sonner';

type ToastOptions = {
  description?: string;
  duration?: number;
};

export function showToast(title: string, options?: ToastOptions) {
  toast.custom(
    (t) => (
      <div className="flex items-center gap-2.5 w-full max-w-sm rounded-xl bg-[#1c1212]/95 backdrop-blur-md shadow-2xl px-3.5 py-2.5">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-orange/15 flex-shrink-0">
          <svg className="w-3 h-3 text-orange-warm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-sm font-medium leading-snug">{title}</p>
          {options?.description && (
            <p className="text-white/35 text-xs mt-0.5 leading-relaxed">{options.description}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="p-1 rounded-md text-white/25 hover:text-white/55 hover:bg-white/5 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    ),
    { duration: options?.duration ?? 4000 }
  );
}

export function showErrorToast(title: string, options?: ToastOptions) {
  toast.custom(
    (t) => (
      <div className="flex items-center gap-2.5 w-full max-w-sm rounded-xl bg-[#1c1010]/95 backdrop-blur-md shadow-2xl px-3.5 py-2.5">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 flex-shrink-0">
          <svg className="w-3 h-3 text-red-300/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-red-200/85 text-sm font-medium leading-snug">{title}</p>
          {options?.description && (
            <p className="text-white/30 text-xs mt-0.5 leading-relaxed">{options.description}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="p-1 rounded-md text-white/25 hover:text-red-300/60 hover:bg-red-500/10 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    ),
    { duration: options?.duration ?? 5000 }
  );
}