import Papa from 'papaparse';
import { Transaction } from '../types';

// Flexible column detection – handles different bank CSV formats
function detectColumns(headers: string[]): {
  date: string | null;
  description: string | null;
  amount: string | null;
  credit: string | null;
  debit: string | null;
} {
  const lower = headers.map(h => h.toLowerCase().trim());

  const find = (...terms: string[]) =>
    headers[lower.findIndex(h => terms.some(t => h.includes(t)))] ?? null;

  return {
    date: find('date', 'time', 'posted'),
    description: find('description', 'narration', 'details', 'reference', 'memo', 'payee', 'merchant'),
    amount: find('amount', 'value'),
    credit: find('credit', 'deposit', 'money in'),
    debit: find('debit', 'withdrawal', 'money out'),
  };
}

export function parseCSV(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        if (!rows.length) return reject(new Error('CSV is empty'));

        const headers = Object.keys(rows[0]);
        const cols = detectColumns(headers);

        if (!cols.date || !cols.description) {
          return reject(new Error('Could not detect date or description columns. Please check your CSV format.'));
        }

        const transactions: Transaction[] = rows
          .map((row, i) => {
            let amount = 0;

            if (cols.amount) {
              const raw = row[cols.amount]?.replace(/[^0-9.-]/g, '') ?? '0';
              amount = parseFloat(raw) || 0;
            } else if (cols.credit || cols.debit) {
              const credit = parseFloat(row[cols.credit!]?.replace(/[^0-9.]/g, '') ?? '0') || 0;
              const debit = parseFloat(row[cols.debit!]?.replace(/[^0-9.]/g, '') ?? '0') || 0;
              amount = credit > 0 ? credit : -debit;
            }

            return {
              id: `txn-${i}`,
              date: row[cols.date!]?.trim() ?? '',
              description: row[cols.description!]?.trim() ?? '',
              amount,
              category: 'Uncategorised',
              rawRow: row,
            };
          })
          .filter(t => t.description); // drop blank rows

        resolve(transactions);
      },
      error: (err) => reject(new Error(err.message)),
    });
  });
}