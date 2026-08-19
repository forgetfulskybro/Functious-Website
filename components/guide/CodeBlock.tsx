'use client';

import { useState, useEffect, useRef, Fragment, ReactNode } from 'react';
import { runTagSafe } from '@/app/interpreter';
import Image from 'next/image';

interface CodeBlockProps {
  code: string;
  title?: string;
}

function buildDemoContext(args: string[] = []) {
  return {
    args,
    user: {
      id: '123456789012345678',
      username: 'GuideUser',
      discriminator: '0000',
      tag: 'GuideUser#0000',
      display_name: 'Guide User',
      global_name: 'Guide User',
      avatar: null,
      avatar_url: null,
      banner: null,
      bot: false,
      system: false,
      created_at: '2021-05-14T18:32:00.000Z',
    },
    channel: {
      id: '987654321098765432',
      name: 'general',
      type: 0,
      guild_id: '555666777888999000',
      position: 3,
      topic: 'General discussion',
      nsfw: false,
      mention: '<#987654321098765432>',
      rate_limit: 0,
      created_at: '2022-01-10T09:15:00.000Z',
    },
    message: {
      id: '111222333444555666',
      content: '!tag example',
      author_id: '123456789012345678',
      channel_id: '987654321098765432',
      guild_id: '555666777888999000',
      created_at: new Date().toISOString(),
      edited_timestamp: null,
      mentions: [],
      mention_roles: [],
      mention_everyone: false,
      attachments: [],
      pinned: false,
      tts: false,
      webhook_id: null,
      type: 0,
      flags: 0,
      url: 'https://fluxer.app/channels/555666777888999000/987654321098765432/111222333444555666',
    },
    guild: {
      id: '555666777888999000',
      name: 'Guide Server',
      icon: null,
      icon_url: null,
      banner: null,
      banner_url: null,
      description: null,
      owner_id: '123456789012345678',
      features: [],
      premium_tier: 0,
      member_count: 128,
      preferred_locale: 'en-US',
      created_at: '2020-11-03T14:22:00.000Z',
    },
  };
}

function codeSnippet(code: string, line?: number | null, col?: number | null) {
  if (!code) return null;
  if (line != null) {
    const text = code.split('\n')[line - 1] ?? '';
    const colIndex = Math.min(Math.max(0, (col ?? 1) - 1), text.length);
    const gutter = String(line);
    return `${gutter} | ${text}\n${' '.repeat(gutter.length + 3 + colIndex)}^`;
  }
  return null;
}

function Mention({ children, type = 'user' }: { children: ReactNode; type?: 'user' | 'channel' | 'role' | 'everyone' }) {
  const colors = {
    user: 'bg-[#4779AB]/20 text-[#66B3FF] hover:bg-[#4F8AC4]/30',
    channel: 'bg-[#4779AB]/20 text-[#66B3FF] hover:bg-[#4F8AC4]/30',
    role: 'bg-[#4779AB]/20 text-[#66B3FF] hover:bg-[#4F8AC4]/30',
    everyone: 'bg-[#4779AB]/20 text-[#66B3FF] hover:bg-[#4F8AC4]/30',
  };

  return (
    <span
      className={`inline-block rounded px-1 py-0.5 font-medium transition-colors cursor-pointer ${colors[type]}`}
    >
      {children}
    </span>
  );
}

export function Markdown({ text }: { text: string }) {
  if (!text) return null;

  const parts: Array<{ type: 'text' | 'code'; content: string; lang?: string }> = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({
      type: 'code',
      lang: match[1] || undefined,
      content: match[1] + match[2].replace(/\n$/, ''),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'code') {
          return (
            <pre
              key={i}
              className="my-1.5 overflow-x-auto rounded-lg border border-white/10 bg-[#1e1f22] px-3.5 py-2.5 font-mono text-[0.85em] leading-relaxed text-[#dbdee1]"
            >
              <code className="whitespace-pre">{part.content}</code>
            </pre>
          );
        }

        const lines = part.content.split('\n');
        
        // Group consecutive quote lines + detect headers
        const groups: Array<
          | { type: 'quote'; content: string[] }
          | { type: 'header'; level: number; content: string }
          | { type: 'normal'; content: string }
        > = [];
        
        for (const line of lines) {
          // Headers: # ## ### #### ##### ######
          const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
          if (headerMatch) {
            groups.push({
              type: 'header',
              level: headerMatch[1].length,
              content: headerMatch[2],
            });
            continue;
          }
        
          const quoteMatch = line.match(/^>\s?(.*)$/);
          if (quoteMatch) {
            const last = groups[groups.length - 1];
            if (last?.type === 'quote') {
              last.content.push(quoteMatch[1] || '\u00A0');
            } else {
              groups.push({ type: 'quote', content: [quoteMatch[1] || '\u00A0'] });
            }
            continue;
          }
        
          groups.push({ type: 'normal', content: line });
        }
        
        return (
          <Fragment key={i}>
            {groups.map((group, gIdx) => {
              if (group.type === 'quote') {
                return (
                  <div
                    key={gIdx}
                    className="border-l-4 border-[#66678D] pl-3 my-1 text-white/80"
                  >
                    {group.content.map((text, tIdx) => (
                      <div key={tIdx} className={tIdx > 0 ? 'mt-0.5' : undefined}>
                        {text}
                      </div>
                    ))}
                  </div>
                );
              }
        
              if (group.type === 'header') {
                const sizes: Record<number, string> = {
                  1: 'text-2xl font-bold mt-4 mb-2',
                  2: 'text-xl font-bold mt-3 mb-1.5',
                  3: 'text-lg font-semibold mt-2.5 mb-1',
                  4: 'text-base font-semibold mt-2 mb-1',
                  5: 'text-sm font-semibold mt-1.5 mb-0.5',
                  6: 'text-sm font-medium mt-1 mb-0.5 text-white/70',
                };
              
                const className = `${sizes[group.level] || sizes[6]} text-white`;
              
                if (group.level === 1) return <h1 key={gIdx} className={className}>{renderInline(group.content)}</h1>;
                if (group.level === 2) return <h2 key={gIdx} className={className}>{renderInline(group.content)}</h2>;
                if (group.level === 3) return <h3 key={gIdx} className={className}>{renderInline(group.content)}</h3>;
                if (group.level === 4) return <h4 key={gIdx} className={className}>{renderInline(group.content)}</h4>;
                if (group.level === 5) return <h5 key={gIdx} className={className}>{renderInline(group.content)}</h5>;
                return <h6 key={gIdx} className={className}>{renderInline(group.content)}</h6>;
              }     
        
              return (
                <Fragment key={gIdx}>
                  {gIdx > 0 && <br />}
                  {renderInline(group.content)}
                </Fragment>
              );
            })}
          </Fragment>
        );
      })}
    </>
  );
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const patterns: Array<{
    regex: RegExp;
    render: (match: RegExpExecArray) => ReactNode;
  }> = [
    {
        regex: /<(https?:\/\/[^>\s]+)>/,
        render: (m) => (
          <a
            key={key++}
            href={m[1]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00a8fc] hover:underline break-all"
          >
            {m[1]}
          </a>
        ),
      },
      {
        regex: /\[([^\]]+)\]\((?:<(https?:\/\/[^>\s]+)>|(https?:\/\/[^)\s]+))\)/,
        render: (m) => (
          <a
            key={key++}
            href={m[2] || m[3]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00a8fc] hover:underline"
          >
            {m[1]}
          </a>
        ),
      },

      {
        regex: /(?<!<)(https?:\/\/[^\s<]+)/,
        render: (m) => (
          <a
            key={key++}
            href={m[1]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00a8fc] hover:underline break-all"
          >
            {m[1]}
          </a>
        ),
      },
      {
      regex: /<@!?(\d+)>/,
      render: (m) => (
        <Mention key={key++} type="user">
          @GuideUser
        </Mention>
      ),
    },
    {
      regex: /<#(\d+)>/,
      render: (m) => (
        <Mention key={key++} type="channel">
          #channel
        </Mention>
      ),
    },
    {
      regex: /<@&(\d+)>/,
      render: (m) => (
        <Mention key={key++} type="role">
          @role
        </Mention>
      ),
    },
    {
      regex: /@(everyone|here)\b/,
      render: (m) => (
        <Mention key={key++} type="everyone">
          @{m[1]}
        </Mention>
      ),
    },
    {
      regex: /\|\|(.+?)\|\|/,
      render: (m) => (
        <span
          key={key++}
          className="rounded bg-black/60 text-transparent hover:text-white/80 hover:bg-black/40 cursor-pointer transition-colors px-0.5"
          title="Spoiler"
        >
          {m[1]}
        </span>
      ),
    },
    {
      regex: /\*\*(.+?)\*\*/,
      render: (m) => (
        <strong key={key++} className="font-semibold text-white/90">
          {renderInline(m[1])}
        </strong>
      ),
    },
    {
      regex: /__(.+?)__/,
      render: (m) => (
        <span key={key++} className="underline underline-offset-2">
          {renderInline(m[1])}
        </span>
      ),
    },
    {
      regex: /~~(.+?)~~/,
      render: (m) => (
        <span key={key++} className="line-through text-white/50">
          {renderInline(m[1])}
        </span>
      ),
    },
    {
      regex: /(?:\*(?!\*)(.+?)\*(?!\*)|_(?!_)(.+?)_(?!_))/,
      render: (m) => (
        <em key={key++} className="italic">
          {renderInline(m[1] || m[2])}
        </em>
      ),
    },
    {
      regex: /`([^`]+)`/,
      render: (m) => (
        <code
          key={key++}
          className="rounded bg-black/40 px-1 py-0.5 font-mono text-[0.85em] text-orange-200/90"
        >
          {m[1]}
        </code>
      ),
    },
  ];

  while (remaining.length > 0) {
    let earliest: { index: number; length: number; node: ReactNode } | null = null;

    for (const { regex, render } of patterns) {
      const match = regex.exec(remaining);
      if (match && match.index !== undefined) {
        if (!earliest || match.index < earliest.index) {
          earliest = {
            index: match.index,
            length: match[0].length,
            node: render(match),
          };
        }
      }
    }

    if (earliest) {
      if (earliest.index > 0) {
        nodes.push(remaining.slice(0, earliest.index));
      }
      nodes.push(earliest.node);
      remaining = remaining.slice(earliest.index + earliest.length);
    } else {
      nodes.push(remaining);
      break;
    }
  }

  return nodes;
}

const LINE_HEIGHT_PX = 22.75;
const VERTICAL_PADDING_PX = 32;
const MAX_VISIBLE_LINES = 20;

export default function CodeBlock({ code, title = 'rune' }: CodeBlockProps) {
  const isRune = /rune/i.test(title);
  const [copied, setCopied] = useState(false);
  const [value, setValue] = useState(code);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    text?: string;
    embeds?: any[];
    error?: any;
  } | null>(null);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });

  const dirty = isRune && value !== code;
  const lines = value.split('\n');
  const visibleLineCount = Math.min(Math.max(lines.length, 1), MAX_VISIBLE_LINES);
  const editorHeight = visibleLineCount * LINE_HEIGHT_PX + VERTICAL_PADDING_PX;

  useEffect(() => {
    setValue(code);
    setResult(null);
    setCursor({ line: 1, col: 1 });
  }, [code]);

  function updateCursor(el: HTMLTextAreaElement) {
    const pos = el.selectionStart ?? 0;
    const textBefore = el.value.slice(0, pos);
    const parts = textBefore.split('\n');
    setCursor({
      line: parts.length,
      col: (parts[parts.length - 1]?.length ?? 0) + 1,
    });
  }

  function syncGutterScroll() {
    if (taRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = taRef.current.scrollTop;
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(isRune ? value : code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const restore = () => {
    setValue(code);
    setResult(null);
    setCursor({ line: 1, col: 1 });
  };

  const run = () => {
    setRunning(true);
    try {
      const out = runTagSafe(value || ' ', buildDemoContext([]));
      if (out.ok) {
        setResult({
          ok: true,
          text: out.result!.text,
          embeds: out.result!.embeds,
        });
      } else {
        setResult({ ok: false, error: out.error });
      }
    } catch (e: any) {
      setResult({
        ok: false,
        error: { name: 'Error', message: e?.message || 'Unknown error' },
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#150a08]">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2">
          <span className="font-mono text-xs text-white/40">{title}</span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={copy}
              className="flex items-center gap-1.5 rounded text-xs text-white/40 transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  <span className="font-medium">Copy</span>
                </>
              )}
            </button>

            {isRune && dirty && (
              <button
                type="button"
                onClick={restore}
                className="flex items-center gap-1.5 rounded text-xs text-white/40 transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 119 9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12V7m0 5h5" />
                </svg>
                <span className="font-medium">Restore</span>
              </button>
            )}

            {isRune && (
              <button
                type="button"
                onClick={run}
                disabled={running}
                className="flex items-center gap-1.5 rounded text-xs text-orange-warm/80 transition-colors hover:text-orange-warm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                title="Run script"
              >
                {running ? (
                  <span className="font-medium">Running…</span>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <polygon points="6,3 20,12 6,21" />
                    </svg>
                    <span className="font-medium">Run</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {isRune ? (
          <div>
            <div className="flex overflow-hidden" style={{ height: editorHeight }}>
              <div
                ref={gutterRef}
                className="flex-shrink-0 select-none overflow-hidden border-r border-white/5 bg-white/[0.02] py-4 text-center font-mono text-sm leading-relaxed text-white/25"
                aria-hidden="true"
              >
                {lines.map((_, i) => (
                  <div key={i} className="px-3">
                    {i + 1}
                  </div>
                ))}
              </div>

              <textarea
                ref={taRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  updateCursor(e.target);
                }}
                onClick={(e) => updateCursor(e.currentTarget)}
                onKeyUp={(e) => updateCursor(e.currentTarget)}
                onSelect={(e) => updateCursor(e.currentTarget)}
                onScroll={syncGutterScroll}
                spellCheck={false}
                className="h-full w-full resize-none overflow-y-auto bg-transparent py-4 pl-3 pr-4 font-mono text-sm leading-relaxed text-orange-light/90 placeholder-white/20 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-3 py-1">
              <button
                type="button"
                onClick={() => taRef.current?.focus()}
                className="font-mono text-[11px] text-white/35 hover:text-white/60 transition-colors"
              >
                Ln {cursor.line}, Col {cursor.col}
              </button>
              <span className="font-mono text-[11px] text-white/25">
                {lines.length} line{lines.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        ) : (
          <pre className="max-h-80 overflow-auto p-4 text-sm leading-relaxed">
            <code className="block whitespace-pre font-mono text-orange-light/90">
              {code}
            </code>
          </pre>
        )}
      </div>

      {isRune && result && (
        <div className="space-y-2">
          {result.ok === false && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-red-400 text-xs font-medium mb-1">
                {result.error?.name || 'Error'}
                {result.error?.line != null &&
                  ` (line ${result.error.line}${
                    result.error.col != null ? `:${result.error.col}` : ''
                  })`}
              </p>
              <p className="text-red-300/80 text-xs mb-2">{result.error?.message}</p>
              {result.error?.line != null && (
                <pre className="text-[11px] text-red-200/70 font-mono whitespace-pre overflow-x-auto">
                  {codeSnippet(value, result.error.line, result.error.col)}
                </pre>
              )}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1e1e24]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/40">#</span>
                <span className="text-sm font-semibold text-white/70">preview</span>
              </div>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-white/30 hover:text-white/70 transition-colors text-sm leading-none"
                title="Close preview"
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-4">
              {result.ok ? (
                <div className="flex gap-3">
                  <Image
                    src="/Functious.png"
                    alt="Functious bot"
                    width={32}
                    height={32}
                    className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-orange-300">Functious</span>
                      <span className="rounded bg-orange/20 px-1 py-0.5 text-[10px] leading-none text-white/35">
                        BOT
                      </span>
                    </div>

                    {result.text?.trim() && (
                      <div className="mt-0.5 text-sm leading-relaxed text-white/70 break-words">
                        <Markdown text={result.text} />
                      </div>
                    )}

                    {result.embeds?.map((emb, i) => (
                      <div
                        key={i}
                        className="mt-2 rounded overflow-hidden border-l-4 max-w-md"
                        style={{
                          borderColor: emb.color
                            ? `#${Number(emb.color).toString(16).padStart(6, '0')}`
                            : '#A52F05',
                          background: 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <div className="p-3 space-y-1.5">
                          {emb.author?.name && (
                            <p className="text-white/60 text-xs font-medium">{emb.author.name}</p>
                          )}
                          {emb.title && (
                            <p className="text-white font-semibold text-sm">{emb.title}</p>
                          )}
                          {emb.description && (
                            <div className="text-white/75 text-sm leading-relaxed">
                              <Markdown text={emb.description} />
                            </div>
                          )}
                          {Array.isArray(emb.fields) && emb.fields.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {emb.fields.map((f: any, fi: number) => (
                                <div key={fi}>
                                  <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">
                                    {f.name}
                                  </p>
                                  <div className="text-white/80 text-xs mt-0.5">
                                    <Markdown text={String(f.value ?? '')} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {emb.footer?.text && (
                            <p className="text-white/40 text-[10px] mt-2">{emb.footer.text}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {!result.text?.trim() && (!result.embeds || result.embeds.length === 0) && (
                      <p className="text-white/25 text-xs italic mt-1">Script produced no output</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-red-400/70 text-xs">Fix the error and run again</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}