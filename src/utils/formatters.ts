/**
 * Formats an amount into standard FCFA currency string
 */
export function formatFCFA(amount: number): string {
  if (isNaN(amount)) return '0 FCFA';
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

/**
 * Formats a date string (ISO or YYYY-MM-DD) to JJ/MM/AAAA
 */
export function formatDate(dateStr: string | Date): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a date with time: JJ/MM/AAAA à HH:mm
 */
export function formatDateTime(dateStr: string | Date): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '';
  const dateFormatted = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dateFormatted} à ${hours}:${minutes}`;
}

/**
 * Exports JSON data to a downloadable CSV file in browser
 */
export function exportToCSV<T extends Record<string, any>>(
  filename: string,
  rows: T[],
  columnKeys: { key: keyof T; header: string }[]
) {
  if (!rows || !rows.length) return;

  const headerRow = columnKeys.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
  const dataRows = rows.map((row) =>
    columnKeys
      .map((col) => {
        const val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/\.csv$/, '')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Truncates text with ellipsis
 */
export function truncate(text: string, length = 30): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  if (!name) return 'TF';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
