/**
 * Parses a date string from a bank CSV into a JS Date.
 * Handles the following formats:
 *   YYYYMMDD         → 20260123
 *   YYYY-MM-DD       → 2026-01-23
 *   DD/MM/YYYY       → 23/01/2026
 *   MM/DD/YYYY       → 01/23/2026  (US format, attempted last)
 *   DD-MM-YYYY       → 23-01-2026
 *   DD.MM.YYYY       → 23.01.2026
 *   DD MMM YYYY      → 23 Jan 2026
 *   MMM DD, YYYY     → Jan 23, 2026
 */
export function parseDate(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;

  // YYYYMMDD — 8 digits, no separators (e.g. FNB: "20260123 ")
  if (/^\d{8}$/.test(s)) {
    const y = parseInt(s.slice(0, 4));
    const m = parseInt(s.slice(4, 6)) - 1;
    const d = parseInt(s.slice(6, 8));
    const date = new Date(y, m, d);
    return isValid(date) ? date : null;
  }

  // YYYY-MM-DD (ISO)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const date = new Date(s.slice(0, 10));
    return isValid(date) ? date : null;
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmy = s.match(/^(\d{1,2})[/\-.:](\d{1,2})[/\-.:](\d{2,4})$/);
  if (dmy) {
    const d = parseInt(dmy[1]);
    const m = parseInt(dmy[2]);
    let y = parseInt(dmy[3]);
    if (y < 100) y += 2000;

    // If day > 12 it can't be a month, so definitely DD/MM/YYYY
    if (d > 12) {
      const date = new Date(y, m - 1, d);
      return isValid(date) ? date : null;
    }

    // Otherwise assume DD/MM/YYYY (SA standard)
    const date = new Date(y, m - 1, d);
    return isValid(date) ? date : null;
  }

  // DD MMM YYYY  or  MMM DD, YYYY  (natural language)
  const natural = Date.parse(s);
  if (!isNaN(natural)) return new Date(natural);

  return null;
}

function isValid(d: Date): boolean {
  return d instanceof Date && !isNaN(d.getTime());
}