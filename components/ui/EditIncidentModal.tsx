"use client";

import { useState } from "react";

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

  async function handleSubmit(e: React.SubmitEvent) {
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
      onCloseAction();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={busy ? undefined : onCloseAction}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-[#160a0a] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2A1313]">
          <div>
            <h2
              id="edit-incident-title"
              className="text-white font-bold text-lg"
            >
              Edit incident
            </h2>
            <p className="text-white/30 text-xs mt-0.5 font-mono truncate max-w-[240px]">
              {incident.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseAction}
            disabled={busy}
            className="text-white/40 hover:text-white/80 text-xl disabled:opacity-50 focus-visible:outline-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Service interruption"
                className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
                required
              />
            </div>

            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="What happened and what users should know…"
                className="w-full resize-y bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange min-h-[96px]"
              />
            </div>

            {error && (
              <p className="text-red-400/90 text-xs bg-red-500/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 px-6 pb-6">
            <button
              type="button"
              onClick={onCloseAction}
              disabled={busy}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 font-medium disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !title.trim()}
              className="flex-1 py-3 bg-orange hover:bg-orange-bright disabled:opacity-50 rounded-xl font-semibold text-white transition-colors"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}