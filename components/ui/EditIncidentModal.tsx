"use client";

import { useEffect, useState } from "react";

export type EditableIncident = {
  id: string;
  title: string;
  body: string;
};

export function EditIncidentModal({
  incident,
  onCloseAction,
  onSavedAction,
}: {
  incident: EditableIncident;
  onCloseAction: () => void;
  onSavedAction: (next: { title: string; body: string }) => void;
}) {
  const [title, setTitle] = useState(incident.title);
  const [description, setDescription] = useState(incident.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy]);

  function handleClose() {
    if (busy) return;
    setVisible(false);
    setTimeout(onCloseAction, 180);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/status/incidents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          incidentId: incident.id,
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update incident");
      }

      onSavedAction({ title: title.trim(), body: description.trim() });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-incident-title"
    >
      <div
        className={`absolute inset-0 bg-black/70 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={busy ? undefined : handleClose}
      />

      <div
        className={`relative w-full max-w-md overflow-hidden rounded-xl border border-white/10 bg-[#140b08] shadow-2xl transition-all duration-200 ${
          visible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 pb-4 pt-5">
          <div>
            <h2
              id="edit-incident-title"
              className="text-lg font-semibold tracking-tight text-white"
            >
              Edit incident
            </h2>
            <p className="mt-0.5 max-w-[240px] truncate font-mono text-xs text-white/30">
              {incident.id}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-md p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50 focus-visible:outline-none"
            aria-label="Close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Service interruption"
                className="w-full rounded-lg border border-white/10 bg-[#1c100c] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-orange/50 focus:ring-1 focus:ring-orange/30"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="What happened and what users should know…"
                className="min-h-[96px] w-full resize-y rounded-lg border border-white/10 bg-[#1c100c] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-orange/50 focus:ring-1 focus:ring-orange/30"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <button
              type="button"
              onClick={handleClose}
              disabled={busy}
              className="flex-1 rounded-lg border border-white/10 bg-transparent py-2.5 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !title.trim()}
              className="flex-1 rounded-lg bg-orange py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange/90 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}