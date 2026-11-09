'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type {
  DashboardGuild,
  FluxerGuild,
  FluxerUser,
  GuildChannel,
  GuildData,
  GuildForm,
  GuildRole,
  FormStatus,
} from '@/lib/types';
import { useGuildData } from '@/hooks/useGuildData';
import { useDashboardToasts } from '@/hooks/useDashboardToasts';
import { useChannelProfiles } from '@/hooks/useChannelProfiles';
import Sidebar from '@/components/layout/Sidebar';
import ChannelBadge from '@/components/ui/ChannelBadge';
import ItemActions from '@/components/ui/ItemActions';
import { RowSkeleton } from '@/components/ui/Skeletons';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import {
  DeleteFormModal,
  FormModal,
  FormSubmissionsModal,
  PublishFormModal,
  type FormPayload,
} from './Modals';

const STATUS_STYLES: Record<string, string> = {
  draft: 'border-white/10 bg-white/[0.04] text-white/40',
  open: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  closed: 'border-red-500/15 bg-red-500/[0.06] text-red-300/80',
};

function statusLabel(status: FormStatus | null) {
  if (!status) return 'Draft';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function questionSummary(form: GuildForm) {
  const count = form.questions?.length ?? 0;
  return `${count} question${count === 1 ? '' : 's'}`;
}

interface Props {
  user: FluxerUser;
  guilds: DashboardGuild[];
  activeGuildId: string;
  userGuild: FluxerGuild & { botPresent: boolean };
  initialData: GuildData;
}

export default function FormsClient({
  user,
  guilds,
  activeGuildId,
  userGuild,
  initialData,
}: Props) {
  const { guild, loading, error } = useGuildData(initialData.id);
  const data = guild ?? initialData;
  const guildChannels = (data as any).guildChannels ?? ([] as GuildChannel[]);
  const guildRoles = (data as any).guildRoles ?? ([] as GuildRole[]);

  const [forms, setForms] = useState<GuildForm[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<'all' | FormStatus>('all');
  const [modal, setModal] = useState<'create' | GuildForm | null>(null);
  const [publishTarget, setPublishTarget] = useState<GuildForm | null>(null);
  const [submissionsTarget, setSubmissionsTarget] = useState<GuildForm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GuildForm | null>(null);

  useDashboardToasts(loading, error);

  const loadForms = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch(`/api/bot/guilds/${activeGuildId}/forms`, {
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to load forms');
      setForms(Array.isArray(json.forms) ? json.forms : []);
    } catch (err) {
      showErrorToast('Failed to load forms', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
      setForms([]);
    } finally {
      setListLoading(false);
    }
  }, [activeGuildId]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const channelProfiles = useChannelProfiles(
    forms
      .flatMap((form) => [form.panelChannelId, form.reviewChannelId])
      .filter((id): id is string => !!id),
    guildChannels,
  );

  const channelOptions = useMemo(
    () =>
      (guildChannels as any[])
        .filter((channel) => channel.type === 0)
        .map((channel) => ({
          id: String(channel.id),
          name: String(channel.name),
          type: Number(channel.type ?? 0),
          parentId: channel.parentId ? String(channel.parentId) : null,
        })),
    [guildChannels],
  );

  const roleOptions = useMemo(
    () =>
      (guildRoles as any[]).map((role) => ({
        id: String(role.id),
        name: String(role.name),
        color: Number(role.color ?? 0),
      })),
    [guildRoles],
  );

  const filteredForms = useMemo(
    () =>
      filter === 'all'
        ? forms
        : forms.filter((form) => (form.status ?? 'draft') === filter),
    [filter, forms],
  );

  const livePublishTarget = publishTarget
    ? forms.find((form) => form.id === publishTarget.id) ?? publishTarget
    : null;
  const liveSubmissionsTarget = submissionsTarget
    ? forms.find((form) => form.id === submissionsTarget.id) ?? submissionsTarget
    : null;
  const liveDeleteTarget = deleteTarget
    ? forms.find((form) => form.id === deleteTarget.id) ?? deleteTarget
    : null;

  const iconUrl = userGuild.icon
    ? `https://fluxerusercontent.com/icons/${userGuild.id}/${userGuild.icon}.png?size=64`
    : null;

  async function createForm(payload: FormPayload) {
    setBusy(true);
    try {
      const res = await fetch(`/api/bot/guilds/${activeGuildId}/forms`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to create form');
      setModal(null);
      showToast('Form created', {
        description: 'Open it and publish the panel when you are ready.',
      });
      await loadForms();
    } catch (err) {
      showErrorToast('Failed to create form', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function updateForm(form: GuildForm, payload: FormPayload) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/bot/guilds/${activeGuildId}/forms/${encodeURIComponent(form.id)}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to update form');
      setModal(null);
      showToast('Form updated', {
        description: 'Your form settings and questions have been saved.',
      });
      await loadForms();
    } catch (err) {
      showErrorToast('Failed to update form', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function setFormStatus(form: GuildForm, status: FormStatus) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/bot/guilds/${activeGuildId}/forms/${encodeURIComponent(form.id)}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to update form');
      showToast(status === 'open' ? 'Form opened' : 'Form closed', {
        description:
          status === 'open'
            ? 'Members can now start the form from its panel.'
            : 'New submissions are paused until the form is reopened.',
      });
      await loadForms();
    } catch (err) {
      showErrorToast('Failed to update form', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function publishForm(form: GuildForm, channelId: string) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/bot/guilds/${activeGuildId}/forms/${encodeURIComponent(form.id)}/publish`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to publish form');
      setPublishTarget(null);
      showToast('Form panel published', {
        description: 'Members can start the form by reacting to its panel.',
      });
      await loadForms();
    } catch (err) {
      showErrorToast('Failed to publish form', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function removeForm(form: GuildForm) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/bot/guilds/${activeGuildId}/forms/${encodeURIComponent(form.id)}`,
        { method: 'DELETE', credentials: 'include' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to delete form');
      setDeleteTarget(null);
      setSubmissionsTarget(null);
      showToast('Form deleted', {
        description: 'The panel, submissions and review messages were removed.',
      });
      await loadForms();
    } catch (err) {
      showErrorToast('Failed to delete form', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-bg-dark">
      <Sidebar
        user={user}
        guilds={guilds}
        activeGuildId={activeGuildId}
        currentPage="dashboard"
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <div className="mb-8 flex items-center gap-4 border-b border-white/5 pb-5">
          {iconUrl ? (
            <Image
              src={iconUrl}
              alt={userGuild.name ?? ''}
              width={40}
              height={40}
              className="rounded-xl"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/15 font-bold text-orange-warm">
              {(userGuild.name ?? 'S')[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-white">Forms</h1>
            <p className="mt-0.5 text-xs text-white/40">{userGuild.name}</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-orange/10 bg-orange/[0.04] px-4 py-3 text-xs leading-relaxed text-white/50">
          Forms send questions through DMs, collect answers privately, and send
          each completed submission to your review channel. Publish an open form
          to let members start it from the panel reaction.
        </div>

        <section className="rounded-2xl bg-bg-card p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/45">
                Application Forms
              </h2>
              <p className="mt-0.5 text-[10px] text-white/20">
                {filteredForms.length} form{filteredForms.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg bg-white/[0.04] p-0.5">
                {[
                  { value: 'all' as const, label: 'All' },
                  { value: 'draft' as const, label: 'Draft' },
                  { value: 'open' as const, label: 'Open' },
                  { value: 'closed' as const, label: 'Closed' },
                ].map((entry) => (
                  <button
                    key={entry.value}
                    type="button"
                    onClick={() => setFilter(entry.value)}
                    className={[
                      'rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                      filter === entry.value
                        ? 'bg-orange/15 text-orange-warm'
                        : 'text-white/35 hover:text-white/65',
                    ].join(' ')}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
              {!loading && (
                <button
                  type="button"
                  onClick={() => setModal('create')}
                  disabled={busy}
                  className="flex items-center gap-1.5 rounded-lg bg-orange/10 px-3 py-1.5 text-xs font-medium text-orange-warm transition-colors hover:bg-orange/20 disabled:opacity-50"
                >
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  New Form
                </button>
              )}
            </div>
          </div>

          {loading || listLoading ? (
            <ul className="space-y-2">
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </ul>
          ) : filteredForms.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-white/30">
                {forms.length === 0
                  ? 'No forms created yet.'
                  : 'No forms in this view.'}
              </p>
              <p className="mt-1 text-xs text-white/20">
                Build a draft, add questions, then open and publish it.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredForms.map((form) => (
                <li
                  key={form.id}
                  className="group flex flex-col gap-3 rounded-xl bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-white/85">
                        {form.name || 'Untitled form'}
                      </p>
                      <span
                        className={[
                          'rounded-full border px-2 py-0.5 text-[10px]',
                          STATUS_STYLES[form.status ?? 'draft'],
                        ].join(' ')}
                      >
                        {statusLabel(form.status)}
                      </span>
                      {form.panelMessageId && (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/35">
                          panel published
                        </span>
                      )}
                      {form.anonymous && (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/35">
                          anonymous
                        </span>
                      )}
                    </div>

                    {form.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-white/35">
                        {form.description}
                      </p>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-white/30">
                      <span>{questionSummary(form)}</span>
                      {form.reviewChannelId && (
                        <>
                          <span className="text-white/15">·</span>
                          <span>reviews in</span>
                          <ChannelBadge
                            channelId={form.reviewChannelId}
                            profile={channelProfiles[form.reviewChannelId]}
                            inline
                            showId={false}
                          />
                        </>
                      )}
                      {form.panelChannelId && (
                        <>
                          <span className="text-white/15">·</span>
                          <span>panel in</span>
                          <ChannelBadge
                            channelId={form.panelChannelId}
                            profile={channelProfiles[form.panelChannelId]}
                            inline
                            showId={false}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <ItemActions
                    label="Form actions"
                    className="self-end sm:self-center"
                    actions={[
                      {
                        label: 'View submissions',
                        icon: 'view',
                        onSelect: () => setSubmissionsTarget(form),
                      },
                      {
                        label: 'Edit form',
                        icon: 'edit',
                        disabled: busy,
                        onSelect: () => setModal(form),
                      },
                      ...(form.status === 'open'
                        ? [
                            {
                              label: 'Publish panel',
                              icon: 'send' as const,
                              disabled: busy,
                              onSelect: () => setPublishTarget(form),
                            },
                            {
                              label: 'Close form',
                              icon: 'lock' as const,
                              disabled: busy,
                              onSelect: () => setFormStatus(form, 'closed'),
                            },
                          ]
                        : form.status === 'closed'
                          ? [
                              {
                                label: 'Reopen form',
                                icon: 'unlock' as const,
                                disabled: busy,
                                onSelect: () => setFormStatus(form, 'open'),
                              },
                            ]
                          : []),
                      {
                        label: 'Delete form',
                        icon: 'delete',
                        danger: true,
                        disabled: busy,
                        onSelect: () => setDeleteTarget(form),
                      },
                    ]}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {modal && (
        <FormModal
          initial={modal === 'create' ? undefined : modal}
          channels={channelOptions}
          roles={roleOptions}
          emojis={data.emojis ?? []}
          busy={busy}
          onSave={(payload) =>
            modal === 'create'
              ? createForm(payload)
              : updateForm(modal as GuildForm, payload)
          }
          onClose={() => setModal(null)}
        />
      )}

      {livePublishTarget && (
        <PublishFormModal
          form={livePublishTarget}
          channels={channelOptions}
          busy={busy}
          onPublish={(channelId) => publishForm(livePublishTarget, channelId)}
          onClose={() => setPublishTarget(null)}
        />
      )}

      {liveSubmissionsTarget && (
        <FormSubmissionsModal
          form={liveSubmissionsTarget}
          activeGuildId={activeGuildId}
          channels={channelOptions}
          onClose={() => setSubmissionsTarget(null)}
        />
      )}

      {liveDeleteTarget && (
        <DeleteFormModal
          form={liveDeleteTarget}
          busy={busy}
          onConfirm={() => removeForm(liveDeleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
