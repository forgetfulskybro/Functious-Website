export type TranslationStatus = 'approved' | 'pending' | 'outdated' | 'untranslated';

export interface TranslationNote {
  id: string;
  userId: string;
  text: string;
  createdAt: number;
}

export interface TranslationPreviousVersion {
  value: string;
  status: 'approved' | 'pending';
  updatedAt: number | null;
}

export interface TranslationString {
  key: string;
  category: string;
  baseValue: string;
  value: string;
  status: TranslationStatus;
  updatedAt: number | null;
  updatedBy: string | null;
  approvedAt: number | null;
  editedAt: number | null;
  previous: TranslationPreviousVersion | null;
  notes: TranslationNote[];
}

export interface TranslationStats {
  total: number;
  translated: number;
  approved: number;
  pending: number;
  outdated: number;
  untranslated: number;
  percent: number;
  approvedPercent: number;
}

export interface TranslationLanguageMeta {
  code: string;
  name: string;
  native: string;
  isBase: boolean;
}

export interface TranslationLanguageSummary extends TranslationLanguageMeta {
  stats: TranslationStats;
}

export interface TranslationLanguageData {
  language: TranslationLanguageMeta;
  stats: TranslationStats;
  strings: TranslationString[];
}

export interface TranslationPermissions {
  userId?: string;
  languages: string[];
  requestedLanguages: string[];
  proofreader: boolean;
  developer: boolean;
}

export interface TranslationProfile {
  id: string;
  username?: string | null;
  globalName?: string | null;
  avatar?: string | null;
  avatarUrl?: string | null;
  pending?: boolean;
}

export interface Translator {
  userId: string;
  owner: boolean;
  permissions: TranslationPermissions;
  profile: TranslationProfile | null;
  contributions: {
    approved: number;
    total: number;
  };
}

export interface TranslationMutationResponse {
  ok: boolean;
  string: TranslationString;
  stats: TranslationStats;
}

export interface TranslationImportLanguage {
  code: string;
  name: string;
  native: string;
  strings: number;
}

export interface TranslationImportResult {
  ok: boolean;
  strings: number;
  skipped: number;
  languages: TranslationImportLanguage[];
  errors: string[];
}

export type TranslationBulkAction = 'unreview' | 'approve';

export interface TranslationBulkResult {
  ok: boolean;
  action: TranslationBulkAction;
  changed: number;
  skipped: number;
  stats: TranslationStats;
  strings: TranslationString[];
}
