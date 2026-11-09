'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  FormQuestion,
  FormQuestionType,
  FormStatus,
  FormSubmission,
  FormSubmissionCounts,
  GuildForm,
} from '@/lib/types';
import ChannelDropdown from '@/components/ui/ChannelDropdown';
import RolesDropdown from '@/components/ui/RolesDropdown';
import SelectDropdown from '@/components/ui/SelectDropdown';
import ChannelBadge from '@/components/ui/ChannelBadge';
import UserBadge from '@/components/ui/UserBadge';
import ColorPicker from '@/components/ui/ColorPicker';
import NumberInput from '@/components/ui/NumberInput';
import { Pagination } from '@/components/ui/Pagination';
import ReactionSelect, { type CustomEmoji } from '@/components/ui/ReactionSelect';
import { Toggle } from '@/components/ui/Toggle';
import { showErrorToast, showToast } from '@/components/ui/Toast';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useChannelProfiles, type KnownChannel } from '@/hooks/useChannelProfiles';

interface ChannelOption {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
}

export interface FormPayload {
  name: string;
  description: string | null;
  status: FormStatus;
  panelChannelId: string | null;
  panelEmoji: string;
  reviewChannelId: string | null;
  reviewerRoleIds: string[];
  reviewerPing: boolean;
  color: string | null;
  imageUrl: string | null;
  introMessage: string | null;
  confirmationMessage: string | null;
  acceptMessage: string | null;
  declineMessage: string | null;
  questions: FormQuestion[];
  cooldownMs: number;
  allowMultiple: boolean;
  maxSubmissions: number;
  dmApplicant: boolean;
  anonymous: boolean;
  requiredRoleIds: string[];
}

const STATUS_OPTIONS: { value: FormStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

const QUESTION_TYPES: { value: FormQuestionType; label: string }[] = [
  { value: 'text', label: 'Short text' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'choice', label: 'Multiple choice' },
];

const QUESTIONS_PER_PAGE = 10;
const SUBMISSION_ANSWERS_PER_PAGE = 10;

function questionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `question-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function blankQuestion(type: FormQuestionType = 'text'): FormQuestion {
  return {
    id: questionId(),
    type,
    prompt: '',
    required: true,
    minLength: 0,
    maxLength: type === 'paragraph' ? 2000 : 1000,
    choices: type === 'choice' ? [{ label: '' }, { label: '' }] : [],
  };
}

function formQuestion(question: FormQuestion): FormQuestion {
  return {
    ...question,
    choices:
      question.type === 'choice'
        ? question.choices.map((choice) => ({
            label: choice.label,
            emoji: choice.emoji ?? null,
          }))
        : [],
  };
}

const STATUS_STYLES: Record<string, string> = {
  in_progress: 'border-sky-500/15 bg-sky-500/[0.06] text-sky-300/80',
  pending: 'border-orange/15 bg-orange/[0.06] text-orange-warm/80',
  accepted: 'border-emerald-500/15 bg-emerald-500/[0.06] text-emerald-300/80',
  declined: 'border-red-500/15 bg-red-500/[0.06] text-red-300/80',
  withdrawn: 'border-white/10 bg-white/[0.03] text-white/35',
  expired: 'border-white/10 bg-white/[0.03] text-white/35',
};

function formatSubmissionDate(timestamp: number | null) {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatStatus(status: string | null) {
  if (!status) return 'Unknown';
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function FormModal({
  initial,
  channels,
  roles,
  emojis = [],
  busy,
  onSave,
  onClose,
}: {
  initial?: GuildForm;
  channels: ChannelOption[];
  roles: { id: string; name: string; color?: number }[];
  emojis?: CustomEmoji[];
  busy?: boolean;
  onSave: (payload: FormPayload) => void | Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<FormStatus>(
    initial?.status ?? 'draft',
  );
  const [panelChannelId, setPanelChannelId] = useState(
    initial?.panelChannelId ?? '',
  );
  const [panelEmoji, setPanelEmoji] = useState(initial?.panelEmoji ?? '📝');
  const [reviewChannelId, setReviewChannelId] = useState(
    initial?.reviewChannelId ?? '',
  );
  const [reviewerRoleIds, setReviewerRoleIds] = useState<string[]>(
    initial?.reviewerRoleIds ?? [],
  );
  const [reviewerPing, setReviewerPing] = useState(
    initial?.reviewerPing !== false,
  );
  const [requiredRoleIds, setRequiredRoleIds] = useState<string[]>(
    initial?.requiredRoleIds ?? [],
  );
  const [color, setColor] = useState(initial?.color ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [introMessage, setIntroMessage] = useState(
    initial?.introMessage ?? '',
  );
  const [confirmationMessage, setConfirmationMessage] = useState(
    initial?.confirmationMessage ?? '',
  );
  const [acceptMessage, setAcceptMessage] = useState(
    initial?.acceptMessage ?? '',
  );
  const [declineMessage, setDeclineMessage] = useState(
    initial?.declineMessage ?? '',
  );
  const [cooldownHours, setCooldownHours] = useState(() => {
    const hours = Math.round(
      (initial?.cooldownMs ?? 24 * 60 * 60 * 1000) / (60 * 60 * 1000),
    );
    return Math.min(720, Math.max(1, hours));
  });
  const [allowMultiple, setAllowMultiple] = useState(
    initial?.allowMultiple === true,
  );
  const [maxSubmissions, setMaxSubmissions] = useState(() => {
    const max = Math.round(initial?.maxSubmissions ?? 0);
    return Math.min(1000, Math.max(0, max));
  });
  const [dmApplicant, setDmApplicant] = useState(
    initial?.dmApplicant !== false,
  );
  const [anonymous, setAnonymous] = useState(initial?.anonymous === true);
  const [questions, setQuestions] = useState<FormQuestion[]>(
    initial?.questions?.length
      ? initial.questions.map(formQuestion)
      : [blankQuestion()],
  );
  const [questionPage, setQuestionPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const isBusy = submitting || !!busy;
  const questionTotalPages = Math.max(
    1,
    Math.ceil(questions.length / QUESTIONS_PER_PAGE),
  );
  const questionStart = questionPage * QUESTIONS_PER_PAGE;
  const visibleQuestions = questions.slice(
    questionStart,
    questionStart + QUESTIONS_PER_PAGE,
  );

  useEffect(() => {
    setQuestionPage((current) =>
      Math.min(current, questionTotalPages - 1),
    );
  }, [questionTotalPages]);

  function updateQuestion(id: string, patch: Partial<FormQuestion>) {
    setQuestions((previous) =>
      previous.map((question) =>
        question.id === id ? { ...question, ...patch } : question,
      ),
    );
  }

  function changeQuestionType(question: FormQuestion, type: FormQuestionType) {
    updateQuestion(question.id, {
      type,
      maxLength:
        type === 'paragraph'
          ? Math.max(question.maxLength, 2000)
          : Math.min(question.maxLength, 1000),
      choices:
        type === 'choice'
          ? question.choices.length >= 2
            ? question.choices
            : [{ label: '' }, { label: '' }]
          : [],
    });
  }

  function addQuestion() {
    if (questions.length >= 50) return;
    setQuestionPage(Math.floor(questions.length / QUESTIONS_PER_PAGE));
    setQuestions((previous) => [...previous, blankQuestion()]);
  }

  function removeQuestion(id: string) {
    if (questions.length <= 1) return;
    const nextLength = questions.length - 1;
    setQuestions((previous) =>
      previous.filter((question) => question.id !== id),
    );
    setQuestionPage((current) =>
      Math.min(
        current,
        Math.max(0, Math.ceil(nextLength / QUESTIONS_PER_PAGE) - 1),
      ),
    );
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    setQuestionPage(Math.floor(target / QUESTIONS_PER_PAGE));
    setQuestions((previous) => {
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateChoice(
    questionIdValue: string,
    choiceIndex: number,
    label: string,
  ) {
    setQuestions((previous) =>
      previous.map((question) =>
        question.id === questionIdValue
          ? {
              ...question,
              choices: question.choices.map((choice, index) =>
                index === choiceIndex ? { ...choice, label } : choice,
              ),
            }
          : question,
      ),
    );
  }

  function addChoice(question: FormQuestion) {
    if (question.choices.length >= 10) return;
    updateQuestion(question.id, {
      choices: [...question.choices, { label: '' }],
    });
  }

  function removeChoice(question: FormQuestion, index: number) {
    if (question.choices.length <= 2) return;
    updateQuestion(question.id, {
      choices: question.choices.filter((_, choiceIndex) => choiceIndex !== index),
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isBusy) return;

    if (!name.trim()) {
      showErrorToast('Name required', {
        description: 'Give the form a name.',
      });
      return;
    }

    if (status === 'open') {
      if (!reviewChannelId) {
        showErrorToast('Review channel required', {
          description: 'Choose where completed submissions should be reviewed.',
        });
        return;
      }
      if (questions.length === 0) {
        showErrorToast('Question required', {
          description: 'Add at least one question before opening the form.',
        });
        return;
      }
    }

    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      if (!question.prompt.trim()) {
        showErrorToast('Question prompt required', {
          description: `Question ${index + 1} needs a prompt.`,
        });
        return;
      }
      if (question.type === 'choice') {
        const choices = question.choices
          .map((choice) => choice.label.trim())
          .filter(Boolean);
        if (choices.length < 2) {
          showErrorToast('Choices required', {
            description: `Question ${index + 1} needs at least two choices.`,
          });
          return;
        }
      }
    }

    if (!Number.isInteger(cooldownHours) || cooldownHours < 1 || cooldownHours > 720) {
      showErrorToast('Invalid cooldown', {
        description: 'Cooldown must be between 1 and 720 hours.',
      });
      return;
    }

    if (!Number.isInteger(maxSubmissions) || maxSubmissions < 0 || maxSubmissions > 1000) {
      showErrorToast('Invalid submission limit', {
        description: 'Max accepted submissions must be 0-1000 (0 = unlimited).',
      });
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        status,
        panelChannelId: panelChannelId || null,
        panelEmoji: panelEmoji.trim() || '📝',
        reviewChannelId: reviewChannelId || null,
        reviewerRoleIds,
        reviewerPing,
        color: color.trim() || null,
        imageUrl: imageUrl.trim() || null,
        introMessage: introMessage.trim() || null,
        confirmationMessage: confirmationMessage.trim() || null,
        acceptMessage: acceptMessage.trim() || null,
        declineMessage: declineMessage.trim() || null,
        questions: questions.map((question) => ({
          ...question,
          prompt: question.prompt.trim(),
          choices:
            question.type === 'choice'
              ? question.choices
                  .filter((choice) => choice.label.trim())
                  .map((choice) => ({
                    label: choice.label.trim(),
                    emoji: choice.emoji ?? null,
                  }))
              : [],
        })),
        cooldownMs: Math.round(cooldownHours * 60 * 60 * 1000),
        allowMultiple,
        maxSubmissions,
        dmApplicant,
        anonymous,
        requiredRoleIds,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isBusy ? undefined : onClose}
      />

      <div className="relative flex h-[min(760px,92dvh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#2A1313] px-5 pb-3 pt-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-white">
              {initial ? 'Edit Form' : 'Create Form'}
            </h2>
            <p className="mt-0.5 text-xs text-white/30">
              Questions are asked privately in DMs; reviews go to a team channel.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="text-xl leading-none text-white/40 hover:text-white disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Form name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  placeholder="Staff application"
                  className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Status
                </label>
                <SelectDropdown
                  label=""
                  value={status}
                  onChange={(value) => setStatus(value as FormStatus)}
                  options={STATUS_OPTIONS}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">
                Description <span className="text-white/25">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="What is this form for?"
                className="w-full resize-y rounded-lg bg-white/5 px-3 py-2.5 text-sm leading-relaxed text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Review channel
                </label>
                <ChannelDropdown
                  channels={channels}
                  value={reviewChannelId}
                  onChangeAction={setReviewChannelId}
                  types={[0]}
                  placeholder="Where submissions are reviewed"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Panel channel <span className="text-white/25">(optional)</span>
                </label>
                <ChannelDropdown
                  channels={channels}
                  value={panelChannelId}
                  onChangeAction={setPanelChannelId}
                  types={[0]}
                  placeholder="Where the panel is posted"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Reviewer roles
                </label>
                <RolesDropdown
                  roles={roles}
                  multiple
                  multiValue={reviewerRoleIds}
                  onMultiChange={setReviewerRoleIds}
                  placeholder="Admins only"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Required member roles
                </label>
                <RolesDropdown
                  roles={roles}
                  multiple
                  multiValue={requiredRoleIds}
                  onMultiChange={setRequiredRoleIds}
                  placeholder="Everyone can apply"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr_1fr]">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Panel emoji
                </label>
                <ReactionSelect
                  value={panelEmoji}
                  onChange={setPanelEmoji}
                  customEmojis={emojis}
                  placeholder="📝"
                  disabled={isBusy}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Image URL <span className="text-white/25">(optional)</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://example.com/banner.png"
                  className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Accent color <span className="text-white/25">(optional)</span>
                </label>
                <ColorPicker
                  value={color}
                  onChange={setColor}
                  placeholder="#A52F05"
                  disabled={isBusy}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/45">
                    Questions
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/25">
                    {questions.length} / 50 · asked in order
                    {questionTotalPages > 1 && (
                      <> · page {questionPage + 1} of {questionTotalPages}</>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={questions.length >= 50 || isBusy}
                  className="rounded-lg bg-orange/10 px-2.5 py-1.5 text-[11px] font-medium text-orange-warm transition-colors hover:bg-orange/20 disabled:opacity-40"
                >
                  + Add question
                </button>
              </div>

              <div className="space-y-2">
                {visibleQuestions.map((question, pageIndex) => {
                  const index = questionStart + pageIndex;
                  return (
                  <div
                    key={question.id}
                    className="rounded-lg border border-white/5 bg-black/10 p-2.5"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
                        Question {index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, -1)}
                          disabled={index === 0}
                          className="rounded p-1 text-white/25 hover:bg-white/5 hover:text-white/60 disabled:opacity-20"
                          aria-label="Move question up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, 1)}
                          disabled={index === questions.length - 1}
                          className="rounded p-1 text-white/25 hover:bg-white/5 hover:text-white/60 disabled:opacity-20"
                          aria-label="Move question down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(question.id)}
                          disabled={questions.length <= 1}
                          className="rounded p-1 text-white/25 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-20"
                          aria-label="Remove question"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[160px_1fr]">
                      <SelectDropdown
                        label=""
                        value={question.type}
                        onChange={(value) =>
                          changeQuestionType(
                            question,
                            value as FormQuestionType,
                          )
                        }
                        options={QUESTION_TYPES}
                      />
                      <input
                        type="text"
                        value={question.prompt}
                        onChange={(event) =>
                          updateQuestion(question.id, {
                            prompt: event.target.value,
                          })
                        }
                        maxLength={500}
                        placeholder="Ask the applicant…"
                        className="w-full rounded-lg bg-white/5 px-2.5 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
                      />
                    </div>

                    {question.type === 'choice' && (
                      <div className="mt-1.5 space-y-1">
                        {question.choices.map((choice, choiceIndex) => (
                          <div
                            key={`${question.id}-${choiceIndex}`}
                            className="flex items-center gap-2"
                          >
                            <span className="w-4 flex-shrink-0 text-right text-[10px] tabular-nums text-white/25">
                              {choiceIndex + 1}
                            </span>
                            <input
                              type="text"
                              value={choice.label}
                              onChange={(event) =>
                                updateChoice(
                                  question.id,
                                  choiceIndex,
                                  event.target.value,
                                )
                              }
                              maxLength={100}
                              placeholder={`Choice ${choiceIndex + 1}`}
                              className="min-w-0 flex-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-orange"
                            />
                            <button
                              type="button"
                              onClick={() => removeChoice(question, choiceIndex)}
                              disabled={question.choices.length <= 2}
                              className="p-1 text-white/25 hover:text-red-400 disabled:opacity-20"
                              aria-label="Remove choice"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addChoice(question)}
                          disabled={question.choices.length >= 10}
                          className="ml-6 text-[11px] text-orange-warm/70 hover:text-orange-warm disabled:opacity-30"
                        >
                          + Add choice
                        </button>
                      </div>
                    )}

                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-[10px] text-white/35">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(event) =>
                            updateQuestion(question.id, {
                              required: event.target.checked,
                            })
                          }
                          className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-orange"
                        />
                        Required
                      </label>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                        <span>Max length</span>
                        <div className="w-24">
                          <NumberInput
                            compact
                            value={question.maxLength}
                            onChange={(value) =>
                              updateQuestion(question.id, { maxLength: value })
                            }
                            min={1}
                            max={2000}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
              <Pagination
                page={questionPage}
                totalPages={questionTotalPages}
                total={questions.length}
                pageSize={QUESTIONS_PER_PAGE}
                onChange={setQuestionPage}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Cooldown between submissions (hours)
                </label>
                <NumberInput
                  value={cooldownHours}
                  onChange={setCooldownHours}
                  min={1}
                  max={720}
                  placeholder="24"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Max accepted submissions
                </label>
                <NumberInput
                  value={maxSubmissions}
                  onChange={setMaxSubmissions}
                  min={0}
                  max={1000}
                  placeholder="0"
                />
                <p className="mt-1 text-[10px] text-white/25">
                  0 means unlimited. Per member.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:grid-cols-2">
              {[
                {
                  label: 'Ping reviewers',
                  description: 'Mention reviewer roles on new submissions.',
                  value: reviewerPing,
                  set: setReviewerPing,
                },
                {
                  label: 'DM applicants',
                  description: 'Send acceptance and decline messages.',
                  value: dmApplicant,
                  set: setDmApplicant,
                },
                {
                  label: 'Allow multiple submissions',
                  description: 'Let members submit more than once.',
                  value: allowMultiple,
                  set: setAllowMultiple,
                },
                {
                  label: 'Anonymous review',
                  description: 'Hide the applicant from review embeds.',
                  value: anonymous,
                  set: setAnonymous,
                },
              ].map((option) => (
                <div
                  key={option.label}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5"
                >
                  <div>
                    <p className="text-xs text-white/70">{option.label}</p>
                    <p className="mt-0.5 text-[10px] text-white/25">
                      {option.description}
                    </p>
                  </div>
                  <Toggle
                    value={option.value}
                    onChangeAction={option.set}
                    disabled={isBusy}
                  />
                </div>
              ))}
            </div>

            <details className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-white/45">
                Custom messages
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    label: 'Intro message',
                    value: introMessage,
                    set: setIntroMessage,
                    placeholder: 'Starting {form}…',
                  },
                  {
                    label: 'Confirmation message',
                    value: confirmationMessage,
                    set: setConfirmationMessage,
                    placeholder: 'Your response to {form} was submitted.',
                  },
                  {
                    label: 'Accept message',
                    value: acceptMessage,
                    set: setAcceptMessage,
                    placeholder: 'Your application was accepted.',
                  },
                  {
                    label: 'Decline message',
                    value: declineMessage,
                    set: setDeclineMessage,
                    placeholder: 'Your application was declined. Reason: {reason}',
                  },
                ].map((message) => (
                  <div key={message.label}>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">
                      {message.label}
                    </label>
                    <textarea
                      value={message.value}
                      onChange={(event) => message.set(event.target.value)}
                      rows={2}
                      maxLength={1000}
                      placeholder={message.placeholder}
                      className="w-full resize-y rounded-lg bg-white/5 px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
                    />
                  </div>
                ))}
              </div>
            </details>
          </div>

          <div className="flex flex-shrink-0 gap-3 border-t border-white/5 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy || !name.trim()}
              className="flex-1 rounded-xl bg-orange py-3 font-semibold text-white transition-colors hover:bg-orange-bright disabled:opacity-50"
            >
              {isBusy ? 'Saving…' : initial ? 'Save Changes' : 'Create Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PublishFormModal({
  form,
  channels,
  busy,
  onPublish,
  onClose,
}: {
  form: GuildForm;
  channels: ChannelOption[];
  busy?: boolean;
  onPublish: (channelId: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const [channelId, setChannelId] = useState(form.panelChannelId ?? '');
  const [submitting, setSubmitting] = useState(false);
  const isBusy = submitting || !!busy;

  async function handlePublish() {
    if (!channelId || isBusy) return;
    try {
      setSubmitting(true);
      await onPublish(channelId);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isBusy ? undefined : onClose}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="border-b border-[#2A1313] px-6 pb-4 pt-5">
          <h2 className="text-lg font-bold text-white">Publish form panel</h2>
          <p className="mt-0.5 text-xs text-white/30">
            The panel will be posted with the form&apos;s reaction. Existing panels
            are replaced.
          </p>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Panel channel
            </label>
            <ChannelDropdown
              channels={channels}
              value={channelId}
              onChangeAction={setChannelId}
              types={[0]}
              placeholder="Select a text channel"
            />
          </div>
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="text-sm font-medium text-white/80">
              {form.name || 'Untitled form'}
            </p>
            <p className="mt-0.5 text-xs text-white/30">
              {form.questions.length} question
              {form.questions.length === 1 ? '' : 's'} · react with{' '}
              {form.panelEmoji || '📝'} to start
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isBusy || !channelId}
            className="flex-1 rounded-xl bg-orange py-3 font-semibold text-white transition-colors hover:bg-orange-bright disabled:opacity-50"
          >
            {isBusy ? 'Publishing…' : 'Publish panel'}
          </button>
        </div>
      </div>
    </div>
  );
}

const SUBMISSION_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'in_progress', label: 'In progress' },
];

export function FormSubmissionsModal({
  form,
  activeGuildId,
  channels,
  onClose,
}: {
  form: GuildForm;
  activeGuildId: string;
  channels: ChannelOption[];
  onClose: () => void;
}) {
  const [status, setStatus] = useState('all');
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [counts, setCounts] = useState<FormSubmissionCounts>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<FormSubmission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormSubmission | null>(null);
  const [answerPages, setAnswerPages] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnswerPages({});
    try {
      const res = await fetch(
        `/api/bot/guilds/${activeGuildId}/forms/${encodeURIComponent(form.id)}/submissions?status=${status}`,
        { credentials: 'include' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to load submissions');
      setSubmissions(Array.isArray(json.submissions) ? json.submissions : []);
      setCounts(json.counts ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [activeGuildId, form.id, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(
    submission: FormSubmission,
    decision: 'accepted' | 'declined',
    reason?: string,
  ) {
    if (decidingId) return;
    setDecidingId(submission.id);
    try {
      const res = await fetch(
        `/api/bot/guilds/${activeGuildId}/forms/${encodeURIComponent(form.id)}/submissions/${encodeURIComponent(submission.id)}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: decision,
            ...(reason ? { reason } : {}),
          }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to review submission');
      setDeclineTarget(null);
      showToast(decision === 'accepted' ? 'Submission accepted' : 'Submission declined', {
        description:
          decision === 'accepted'
            ? 'The applicant was notified.'
            : 'The reason was saved and the applicant was notified.',
      });
      await load();
    } catch (err) {
      showErrorToast('Failed to review submission', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setDecidingId(null);
    }
  }

  async function removeSubmission(submission: FormSubmission) {
    if (deletingId) return;
    setDeletingId(submission.id);
    try {
      const res = await fetch(
        `/api/bot/guilds/${activeGuildId}/forms/${encodeURIComponent(form.id)}/submissions/${encodeURIComponent(submission.id)}`,
        { method: 'DELETE', credentials: 'include' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to delete submission');
      setDeleteTarget(null);
      showToast('Response deleted', {
        description: 'The submission and its review message were removed.',
      });
      await load();
    } catch (err) {
      showErrorToast('Failed to delete response', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setDeletingId(null);
    }
  }

  const profiles = useUserProfiles(
    submissions
      .map((submission) => (form.anonymous ? null : submission.userId))
      .filter((id): id is string => !!id),
  );

  const channelProfiles = useChannelProfiles(
    form.reviewChannelId ? [form.reviewChannelId] : [],
    channels as KnownChannel[],
  );

  const questions = useMemo(
    () => new Map(form.questions.map((question) => [question.id, question.prompt])),
    [form.questions],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex h-[min(620px,90dvh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-[#2A1313] px-5 pb-4 pt-5 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-white">
              {form.name || 'Untitled form'} submissions
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/35">
              <span>
                {counts.pending ?? 0} pending · {counts.accepted ?? 0} accepted ·{' '}
                {counts.declined ?? 0} declined
              </span>
              {form.reviewChannelId && (
                <>
                  <span className="text-white/15">·</span>
                  <ChannelBadge
                    channelId={form.reviewChannelId}
                    profile={channelProfiles[form.reviewChannelId]}
                    inline
                    showId={false}
                  />
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-white/40 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-5 py-3 sm:px-6">
          <div className="flex flex-wrap gap-1">
            {SUBMISSION_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatus(filter.value)}
                className={[
                  'rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                  status === filter.value
                    ? 'bg-orange/15 text-orange-warm'
                    : 'text-white/35 hover:bg-white/5 hover:text-white/65',
                ].join(' ')}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={load}
            className="rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] text-white/45 transition-colors hover:bg-white/10 hover:text-white/70"
          >
            Refresh
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-xl bg-white/[0.04]"
                />
              ))}
            </div>
          ) : error ? (
            <p className="rounded-xl bg-red-500/[0.06] px-4 py-6 text-center text-xs text-red-300/80">
              {error}
            </p>
          ) : submissions.length === 0 ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-white/5 bg-white/[0.015] px-6 text-center">
              <p className="text-sm font-medium text-white/35">
                No submissions in this view
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-white/20">
                Try another status filter or refresh to check for new responses.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {submissions.map((submission) => {
                const answerPageCount = Math.max(
                  1,
                  Math.ceil(submission.answers.length / SUBMISSION_ANSWERS_PER_PAGE),
                );
                const answerPage = Math.min(
                  answerPages[submission.id] ?? 0,
                  answerPageCount - 1,
                );
                const answerStart = answerPage * SUBMISSION_ANSWERS_PER_PAGE;
                const visibleAnswers = submission.answers.slice(
                  answerStart,
                  answerStart + SUBMISSION_ANSWERS_PER_PAGE,
                );

                return (
                <li
                  key={submission.id}
                  className="rounded-xl border border-white/[0.04] bg-white/[0.025] px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {form.anonymous ? (
                      <span className="text-xs text-white/35">
                        Anonymous response
                      </span>
                    ) : submission.userId ? (
                      <UserBadge
                        userId={submission.userId}
                        profile={profiles[submission.userId]}
                        inline
                        size="sm"
                        showId={false}
                      />
                    ) : (
                      <span className="text-xs text-white/35">Unknown member</span>
                    )}
                    <span
                      className={[
                        'rounded-full border px-2 py-0.5 text-[10px]',
                        STATUS_STYLES[submission.status ?? ''] ??
                          STATUS_STYLES.expired,
                      ].join(' ')}
                    >
                      {formatStatus(submission.status)}
                    </span>
                    <span className="text-[10px] text-white/25">
                      {formatSubmissionDate(
                        submission.submittedAt ?? submission.createdAt,
                      )}
                    </span>
                    <span className="ml-auto font-mono text-[9px] text-white/15">
                      {submission.id}
                    </span>
                  </div>

                  {submission.answers.length > 0 && (
                    <div className="mt-3 border-t border-white/5 pt-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">
                          Answers
                        </p>
                        <p className="text-[10px] text-white/20">
                          {submission.answers.length} total
                        </p>
                      </div>
                      <dl className="space-y-1.5">
                        {visibleAnswers.map((answer) => (
                          <div
                            key={`${submission.id}-${answer.questionId}`}
                            className="grid grid-cols-1 gap-0.5 text-xs sm:grid-cols-[180px_1fr]"
                          >
                            <dt className="truncate text-white/30">
                              {questions.get(answer.questionId) ?? answer.questionId}
                            </dt>
                            <dd className="whitespace-pre-wrap text-white/65">
                              {answer.value || '—'}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      {answerPageCount > 1 && (
                        <div className="mt-3 border-t border-white/5 pt-2">
                          <Pagination
                            page={answerPage}
                            totalPages={answerPageCount}
                            total={submission.answers.length}
                            pageSize={SUBMISSION_ANSWERS_PER_PAGE}
                            onChange={(nextPage) =>
                              setAnswerPages((pages) => ({
                                ...pages,
                                [submission.id]: nextPage,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {submission.reason && (
                    <p className="mt-2 border-t border-white/5 pt-2 text-[11px] text-red-300/70">
                      Reason: {submission.reason}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-2">
                    {submission.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => decide(submission, 'accepted')}
                          disabled={!!decidingId || !!deletingId}
                          className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
                        >
                          {decidingId === submission.id ? 'Saving…' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeclineTarget(submission)}
                          disabled={!!decidingId || !!deletingId}
                          className="rounded-lg bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-40"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(submission)}
                      disabled={!!decidingId || !!deletingId}
                      className="ml-auto rounded-lg px-2 py-1.5 text-[11px] text-white/25 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                    >
                      {deletingId === submission.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {declineTarget && (
        <DeclineSubmissionModal
          busy={decidingId === declineTarget.id}
          onConfirm={(reason) => decide(declineTarget, 'declined', reason)}
          onClose={() => {
            if (!decidingId) setDeclineTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <DeleteSubmissionModal
          submission={deleteTarget}
          busy={deletingId === deleteTarget.id}
          onConfirm={() => removeSubmission(deleteTarget)}
          onClose={() => {
            if (!deletingId) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}

function DeclineSubmissionModal({
  busy,
  onConfirm,
  onClose,
}: {
  busy?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('A decline reason is required.');
      return;
    }
    setError(null);
    onConfirm(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl"
      >
        <div className="border-b border-[#2A1313] px-6 pb-4 pt-5">
          <h2 className="text-lg font-bold text-white">Decline submission?</h2>
          <p className="mt-0.5 text-xs text-white/30">
            A reason is required and will be sent to the applicant.
          </p>
        </div>
        <div className="px-6 py-5">
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError(null);
            }}
            rows={4}
            maxLength={1000}
            autoFocus
            required
            placeholder="Explain why this submission was declined…"
            className="w-full resize-y rounded-lg bg-white/5 px-3 py-2.5 text-sm leading-relaxed text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
          />
          {error && <p className="mt-1.5 text-[11px] text-red-300/80">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !reason.trim()}
            className="flex-1 rounded-xl bg-red-500/15 py-3 font-semibold text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
          >
            {busy ? 'Declining…' : 'Decline'}
          </button>
        </div>
      </form>
    </div>
  );
}

function DeleteSubmissionModal({
  submission,
  busy,
  onConfirm,
  onClose,
}: {
  submission: FormSubmission;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="border-b border-[#2A1313] px-6 pb-4 pt-5">
          <h2 className="text-lg font-bold text-white">Delete response?</h2>
          <p className="mt-0.5 text-xs text-white/30">
            This permanently removes the submission and its review message.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="text-sm font-medium text-white/80">
              {formatStatus(submission.status)} response
            </p>
            <p className="mt-0.5 text-xs text-white/30">
              {submission.answers.length} answer
              {submission.answers.length === 1 ? '' : 's'} · submitted{' '}
              {formatSubmissionDate(
                submission.submittedAt ?? submission.createdAt,
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-red-500/15 py-3 font-semibold text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteFormModal({
  form,
  busy,
  onConfirm,
  onClose,
}: {
  form: GuildForm;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="border-b border-[#2A1313] px-6 pb-4 pt-5">
          <h2 className="text-lg font-bold text-white">Delete form?</h2>
          <p className="mt-0.5 text-xs text-white/30">
            This removes the form, its panel, every submission and review message.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="truncate text-sm font-medium text-white/80">
              {form.name || 'Untitled form'}
            </p>
            <p className="mt-0.5 text-xs text-white/30">
              {form.questions.length} question
              {form.questions.length === 1 ? '' : 's'} · {form.status}
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-red-500/15 py-3 font-semibold text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
