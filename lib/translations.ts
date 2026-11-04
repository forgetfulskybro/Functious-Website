import { NextResponse } from 'next/server';
import type {
  TranslationBulkAction,
  TranslationBulkResult,
  TranslationImportResult,
  TranslationLanguageData,
  TranslationLanguageSummary,
  TranslationMutationResponse,
  TranslationPermissions,
  Translator,
} from './translationTypes';

const BOT_API_URL = process.env.BOT_API_URL ?? 'http://localhost:4000';
const BOT_API_KEY = process.env.BOT_API_KEY ?? '';

export class TranslationApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'TranslationApiError';
    this.status = status;
  }
}

interface BotRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  userId?: string | null;
  body?: unknown;
  query?: string;
}

async function botRequest<T>(path: string, options: BotRequestOptions = {}): Promise<T> {
  const { method = 'GET', userId, body, query } = options;
  const url = `${BOT_API_URL}${path}${query ? `?${query}` : ''}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': BOT_API_KEY,
        ...(userId ? { 'x-user-id': String(userId) } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw new TranslationApiError(
      'The translation service is unreachable. Try again in a moment.',
      503,
    );
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new TranslationApiError(
      data?.error ?? `Translation service error (${res.status})`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

export async function getTranslationLanguages(): Promise<TranslationLanguageSummary[]> {
  const data = await botRequest<{ languages: TranslationLanguageSummary[] }>(
    '/api/translations',
  );
  return data.languages ?? [];
}

export async function refreshTranslationFiles(
  userId: string,
): Promise<TranslationLanguageSummary[]> {
  const data = await botRequest<{
    ok: boolean;
    languages: TranslationLanguageSummary[];
  }>('/api/translations/refresh', { method: 'POST', userId });
  return data.languages ?? [];
}

export async function getTranslationLanguage(
  code: string,
): Promise<TranslationLanguageData> {
  return botRequest<TranslationLanguageData>(
    `/api/translations/${encodeURIComponent(code)}`,
  );
}

export async function getTranslationPermissions(
  userId: string,
): Promise<TranslationPermissions> {
  const data = await botRequest<{ permissions: TranslationPermissions }>(
    '/api/translations/me',
    { userId },
  );
  return data.permissions;
}

export async function requestTranslationLanguages(
  userId: string,
  languages: string[],
): Promise<TranslationPermissions> {
  const data = await botRequest<{ permissions: TranslationPermissions }>(
    '/api/translations/request',
    { method: 'POST', userId, body: { languages } },
  );
  return data.permissions;
}

export async function saveTranslation(
  userId: string,
  language: string,
  key: string,
  value: string,
): Promise<TranslationMutationResponse> {
  return botRequest<TranslationMutationResponse>(
    `/api/translations/${encodeURIComponent(language)}/${encodeURIComponent(key)}`,
    { method: 'PUT', userId, body: { value } },
  );
}

export async function approveTranslation(
  userId: string,
  language: string,
  key: string,
): Promise<TranslationMutationResponse> {
  return botRequest<TranslationMutationResponse>(
    `/api/translations/${encodeURIComponent(language)}/${encodeURIComponent(key)}/approve`,
    { method: 'POST', userId },
  );
}

export async function revertTranslation(
  userId: string,
  language: string,
  key: string,
): Promise<TranslationMutationResponse> {
  return botRequest<TranslationMutationResponse>(
    `/api/translations/${encodeURIComponent(language)}/${encodeURIComponent(key)}/revert`,
    { method: 'POST', userId },
  );
}

export async function addTranslationNote(
  userId: string,
  language: string,
  key: string,
  text: string,
): Promise<TranslationMutationResponse> {
  return botRequest<TranslationMutationResponse>(
    `/api/translations/${encodeURIComponent(language)}/${encodeURIComponent(key)}/notes`,
    { method: 'POST', userId, body: { text } },
  );
}

export async function deleteTranslationNote(
  userId: string,
  language: string,
  key: string,
  noteId: string,
): Promise<TranslationMutationResponse> {
  return botRequest<TranslationMutationResponse>(
    `/api/translations/${encodeURIComponent(language)}/${encodeURIComponent(key)}/notes/${encodeURIComponent(noteId)}`,
    { method: 'DELETE', userId },
  );
}

const IMPORT_BATCH_FILES = 25;
const IMPORT_BATCH_BYTES = 4 * 1024 * 1024;

function batchImportFiles(
  files: { name: string; content: string }[],
): { name: string; content: string }[][] {
  const batches: { name: string; content: string }[][] = [];
  let batch: { name: string; content: string }[] = [];
  let batchBytes = 0;

  for (const file of files) {
    const bytes = Buffer.byteLength(file.content, 'utf8');
    if (
      batch.length >= IMPORT_BATCH_FILES ||
      (batch.length > 0 && batchBytes + bytes > IMPORT_BATCH_BYTES)
    ) {
      batches.push(batch);
      batch = [];
      batchBytes = 0;
    }

    batch.push(file);
    batchBytes += bytes;
  }

  if (batch.length > 0) batches.push(batch);
  return batches;
}

export async function importTranslations(
  userId: string,
  files: { name: string; content: string }[],
): Promise<TranslationImportResult> {
  const result: TranslationImportResult = {
    ok: true,
    strings: 0,
    skipped: 0,
    languages: [],
    errors: [],
  };

  for (const batch of batchImportFiles(files)) {
    const chunk = await botRequest<TranslationImportResult>(
      '/api/translations/import',
      { method: 'POST', userId, body: { files: batch } },
    );

    result.strings += chunk.strings ?? 0;
    result.skipped += chunk.skipped ?? 0;
    result.errors.push(...(chunk.errors ?? []));

    for (const language of chunk.languages ?? []) {
      const existing = result.languages.find(
        (entry) => entry.code === language.code,
      );
      if (existing) existing.strings += language.strings;
      else result.languages.push({ ...language });
    }
  }

  return result;
}

export async function bulkUpdateTranslations(
  userId: string,
  language: string,
  action: TranslationBulkAction,
  keys: string[],
): Promise<TranslationBulkResult> {
  return botRequest<TranslationBulkResult>(
    `/api/translations/${encodeURIComponent(language)}/bulk`,
    { method: 'POST', userId, body: { action, keys } },
  );
}

export async function getTranslators(userId: string): Promise<Translator[]> {
  const data = await botRequest<{ translators: Translator[] }>(
    '/api/translations/translators',
    { userId },
  );
  return data.translators ?? [];
}

export async function updateTranslator(
  userId: string,
  translatorId: string,
  updates: {
    languages?: string[];
    proofreader?: boolean;
    developer?: boolean;
  },
): Promise<Translator> {
  const data = await botRequest<{ translator: Translator }>(
    `/api/translations/translators/${encodeURIComponent(translatorId)}`,
    { method: 'PATCH', userId, body: updates },
  );
  return data.translator;
}

export async function removeTranslator(
  userId: string,
  translatorId: string,
): Promise<void> {
  await botRequest<{ ok: boolean }>(
    `/api/translations/translators/${encodeURIComponent(translatorId)}`,
    { method: 'DELETE', userId },
  );
}

export async function exportTranslations(
  userId: string,
  languages: string[],
  includePending: boolean,
): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const params = new URLSearchParams();
  if (languages.length > 0) params.set('languages', languages.join(','));
  if (includePending) params.set('includePending', '1');

  let res: Response;
  try {
    res = await fetch(
      `${BOT_API_URL}/api/translations/export${params.size ? `?${params.toString()}` : ''}`,
      {
        headers: {
          'x-api-key': BOT_API_KEY,
          'x-user-id': String(userId),
        },
        cache: 'no-store',
      },
    );
  } catch {
    throw new TranslationApiError(
      'The translation service is unreachable. Try again in a moment.',
      503,
    );
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new TranslationApiError(
      data?.error ?? `Export failed (${res.status})`,
      res.status,
    );
  }

  const disposition = res.headers.get('content-disposition') ?? '';
  const match = disposition.match(/filename="?([^";]+)"?/i);

  return {
    buffer: await res.arrayBuffer(),
    filename: match?.[1] ?? 'functious-translations.zip',
  };
}

export function translationErrorResponse(error: unknown): NextResponse {
  if (error instanceof TranslationApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error('[translations]', error);
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
}
