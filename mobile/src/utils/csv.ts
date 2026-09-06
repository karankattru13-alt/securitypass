import { Platform, Share } from 'react-native';

export interface CsvColumn {
  key: string;
  label: string;
  /** optional value transform */
  map?: (row: any) => any;
}

const escape = (v: any) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCSV(rows: any[], columns?: CsvColumn[]): string {
  const cols: CsvColumn[] =
    columns ??
    (rows[0]
      ? Object.keys(rows[0]).map((k) => ({ key: k, label: k }))
      : []);
  const head = cols.map((c) => escape(c.label)).join(',');
  const body = rows
    .map((r) =>
      cols.map((c) => escape(c.map ? c.map(r) : r[c.key])).join(',')
    )
    .join('\n');
  return `${head}\n${body}`;
}

/**
 * Save/share a CSV. On web this triggers a real file download; on native it
 * opens the share sheet with the CSV text (no extra native deps).
 */
export async function downloadCSV(filename: string, csv: string) {
  const name = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  const g: any = globalThis as any;
  if (Platform.OS === 'web' && g.document && g.URL) {
    const blob = new g.Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = g.URL.createObjectURL(blob);
    const a = g.document.createElement('a');
    a.href = url;
    a.download = name;
    g.document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => g.URL.revokeObjectURL(url), 1000);
  } else {
    await Share.share({ message: csv, title: name });
  }
}
