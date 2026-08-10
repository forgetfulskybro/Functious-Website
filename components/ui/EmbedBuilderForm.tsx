'use client';
import ColorPicker, { toDisplayHex } from '@/components/ui/ColorPicker';
import { useState } from 'react';

export interface EmbedData {
  title?: string | null;
  description?: string | null;
  footer?: { text?: string | null; iconURL?: string | null } | null;
  image?: string | null;
  author?: { name?: string | null; iconURL?: string | null; url?: string | null } | null;
  url?: string | null;
  color?: string | null;
  thumbnail?: string | null;
  useTimestamp?: boolean | null;
}

export const EMBED_PAGES = [
  {
    id: 'content',
    label: 'Content',
    fields: ['title', 'description', 'url', 'color'] as const,
  },
  {
    id: 'author',
    label: 'Author',
    fields: ['author_name', 'author_icon', 'author_url'] as const,
  },
  {
    id: 'footer',
    label: 'Footer',
    fields: ['footer_text', 'footer_icon'] as const,
  },
  {
    id: 'media',
    label: 'Media',
    fields: ['image', 'thumbnail', 'timestamp'] as const,
  },
] as const;

export function emptyEmbedData(): EmbedData {
  return {
    title: null,
    description: null,
    footer: null,
    image: null,
    author: null,
    url: null,
    color: null,
    thumbnail: null,
    useTimestamp: null,
  };
}

export function normalizeEmbedData(data: EmbedData): EmbedData {
  return {
    title: data.title?.trim() || null,
    description: data.description?.trim()?.slice(0, 4040) || null,
    url: data.url?.trim() || null,
    color: data.color?.trim() || null,
    image: data.image?.trim() || null,
    thumbnail: data.thumbnail?.trim() || null,
    useTimestamp: data.useTimestamp || null,
    footer:
      data.footer?.text || data.footer?.iconURL
        ? {
            text: data.footer?.text?.trim() || null,
            iconURL: data.footer?.iconURL?.trim() || null,
          }
        : null,
    author:
      data.author?.name || data.author?.iconURL || data.author?.url
        ? {
            name: data.author?.name?.trim() || null,
            iconURL: data.author?.iconURL?.trim() || null,
            url: data.author?.url?.trim() || null,
          }
        : null,
  };
}

export function embedHasContent(data: EmbedData): boolean {
  return !!(
    data.title ||
    data.description ||
    data.footer?.text ||
    data.image ||
    data.thumbnail ||
    data.author?.name
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-white/50 text-xs font-medium mb-1.5">
      {children}
      {hint && <span className="text-white/25 ml-1">{hint}</span>}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  maxLength,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
    />
  );
}

interface EmbedBuilderFormProps {
  value: EmbedData;
  onChange: (next: EmbedData) => void;
  className?: string;
}

export default function EmbedBuilderForm({
  value,
  onChange,
  className = '',
}: EmbedBuilderFormProps) {
  const [page, setPage] = useState(0);
  const current = EMBED_PAGES[page];

  function patch(patch: Partial<EmbedData>) {
    onChange({ ...value, ...patch });
  }

  function patchFooter(p: Partial<NonNullable<EmbedData['footer']>>) {
    onChange({
      ...value,
      footer: { ...(value.footer || {}), ...p },
    });
  }

  function patchAuthor(p: Partial<NonNullable<EmbedData['author']>>) {
    onChange({
      ...value,
      author: { ...(value.author || {}), ...p },
    });
  }

  return (
    <div className={`rounded-xl bg-white/[0.03] overflow-hidden ${className}`}>
      <div className="relative flex border-b border-white/5">
        {EMBED_PAGES.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPage(i)}
            className={[
              'flex-1 px-2 py-2 text-[11px] font-medium transition-colors duration-150',
              page === i ? 'text-orange-warm' : 'text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            {p.label}
          </button>
        ))}
        <span
          className="absolute bottom-0 h-0.5 bg-orange transition-all duration-200 ease-out"
          style={{
            left: `${(page / EMBED_PAGES.length) * 100}%`,
            width: `${100 / EMBED_PAGES.length}%`,
          }}
        />
      </div>

      <div className="p-4 space-y-3 min-h-[200px]">
        {current.id === 'content' && (
          <>
            <div>
              <FieldLabel hint="max 256">Title</FieldLabel>
              <TextInput
                value={value.title || ''}
                onChange={(v) => patch({ title: v.slice(0, 256) })}
                placeholder="Embed title"
                maxLength={256}
              />
            </div>
            <div>
              <FieldLabel hint="max 4096">Description</FieldLabel>
              <textarea
                value={value.description || ''}
                onChange={(e) => patch({ description: e.target.value.slice(0, 4096) })}
                rows={4}
                placeholder="Main embed body…"
                className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 resize-y focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>URL</FieldLabel>
                <TextInput
                  value={value.url || ''}
                  onChange={(v) => patch({ url: v })}
                  placeholder="https://…"
                  type="url"
                />
              </div>
              <div>
                <FieldLabel hint="#hex">Color</FieldLabel>
                  <ColorPicker
                    value={value.color || ''}
                    onChange={(hex) => patch({ color: hex })}
                    placeholder="#A52F05"
                  />
              </div>
            </div>
          </>
        )}

        {current.id === 'author' && (
          <>
            <div>
              <FieldLabel hint="max 256">Author name</FieldLabel>
              <TextInput
                value={value.author?.name || ''}
                onChange={(v) => patchAuthor({ name: v.slice(0, 256) })}
                placeholder="Author name"
                maxLength={256}
              />
            </div>
            <div>
              <FieldLabel>Author icon URL</FieldLabel>
              <TextInput
                value={value.author?.iconURL || ''}
                onChange={(v) => patchAuthor({ iconURL: v })}
                placeholder="https://…"
                type="url"
              />
            </div>
            <div>
              <FieldLabel>Author link URL</FieldLabel>
              <TextInput
                value={value.author?.url || ''}
                onChange={(v) => patchAuthor({ url: v })}
                placeholder="https://…"
                type="url"
              />
            </div>
          </>
        )}

        {current.id === 'footer' && (
          <>
            <div>
              <FieldLabel hint="max 2048">Footer text</FieldLabel>
              <TextInput
                value={value.footer?.text || ''}
                onChange={(v) => patchFooter({ text: v.slice(0, 2048) })}
                placeholder="Footer text"
                maxLength={2048}
              />
            </div>
            <div>
              <FieldLabel>Footer icon URL</FieldLabel>
              <TextInput
                value={value.footer?.iconURL || ''}
                onChange={(v) => patchFooter({ iconURL: v })}
                placeholder="https://…"
                type="url"
              />
            </div>
          </>
        )}

        {current.id === 'media' && (
          <>
            <div>
              <FieldLabel>Image URL</FieldLabel>
              <TextInput
                value={value.image || ''}
                onChange={(v) => patch({ image: v })}
                placeholder="https://…"
                type="url"
              />
            </div>
            <div>
              <FieldLabel>Thumbnail URL</FieldLabel>
              <TextInput
                value={value.thumbnail || ''}
                onChange={(v) => patch({ thumbnail: v })}
                placeholder="https://…"
                type="url"
              />
            </div>
            <label className="flex items-center justify-between cursor-pointer pt-1">
              <div>
                <p className="text-white/70 text-xs">Show timestamp</p>
                <p className="text-white/25 text-[10px]">Append current time to the embed</p>
              </div>
              <button
                type="button"
                onClick={() => patch({ useTimestamp: !value.useTimestamp })}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  value.useTimestamp ? 'bg-orange' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    value.useTimestamp ? 'translate-x-4' : ''
                  }`}
                />
              </button>
            </label>
          </>
        )}
      </div>

      <div className="flex items-center justify-between px-4 pb-3">
        <p className="text-white/20 text-[10px]">
          {page + 1} / {EMBED_PAGES.length}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1 rounded-md text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {EMBED_PAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={[
                'w-1.5 h-1.5 rounded-full transition-colors',
                i === page ? 'bg-orange' : 'bg-white/20 hover:bg-white/40',
              ].join(' ')}
            />
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(EMBED_PAGES.length - 1, p + 1))}
            disabled={page === EMBED_PAGES.length - 1}
            className="p-1 rounded-md text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmbedDataSummary({ data }: { data: EmbedData }) {
  const fields = [
    data.title && { label: 'Title', value: data.title },
    data.description && { label: 'Description', value: data.description },
    data.url && { label: 'URL', value: data.url },
    data.color && { label: 'Color', value: data.color },
    data.author?.name && { label: 'Author', value: data.author.name },
    data.author?.iconURL && { label: 'Author icon', value: data.author.iconURL },
    data.author?.url && { label: 'Author URL', value: data.author.url },
    data.footer?.text && { label: 'Footer', value: data.footer.text },
    data.footer?.iconURL && { label: 'Footer icon', value: data.footer.iconURL },
    data.image && { label: 'Image', value: data.image },
    data.thumbnail && { label: 'Thumbnail', value: data.thumbnail },
    data.useTimestamp && { label: 'Timestamp', value: 'Yes' },
  ].filter(Boolean) as { label: string; value: string }[];

  if (fields.length === 0) return null;

  return (
    <div>
      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">Embed</p>
      <div className="rounded-xl bg-white/[0.03] divide-y divide-white/5">
        {fields.map((f) => (
          <div key={f.label} className="flex items-start gap-3 px-3 py-2">
            <p className="text-white/40 text-xs w-24 flex-shrink-0 pt-px">{f.label}</p>
            <p className="text-white/75 text-xs break-all whitespace-pre-wrap">{f.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}