// FORK: Voka CRM — utilitário de export CSV client-side
export const exportToCsv = (
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filename: string,
): void => {
  const escape = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return '';
    const str = String(v);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ];

  const bom = '﻿'; // BOM para Excel abrir corretamente em PT-BR
  const blob = new Blob([bom + lines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
