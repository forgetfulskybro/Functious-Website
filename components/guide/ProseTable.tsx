import type { ReactNode } from 'react';
import { Markdown } from '@/components/guide/CodeBlock';

interface ProseTableProps {
  headers: string[];
  rows: ReactNode[][];
}

export default function ProseTable({ headers, rows }: ProseTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#140b08]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white/50"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={
                    cellIndex === 0
                      ? 'whitespace-nowrap px-4 py-2.5 align-top font-mono text-orange-light'
                      : 'px-4 py-2.5 align-top text-white/70'
                  }
                >
                  <Markdown text={String(cell)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}